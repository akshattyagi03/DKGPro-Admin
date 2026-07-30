import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, MoreHorizontal, Eye, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, DataTableWrapper, EmptyState } from '@/components/shared/PageComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OrderStatusModal } from '@/components/modals/FormModals';
import { Order, OrderStatus } from '@/types';
import { ShoppingCart } from 'lucide-react';
import { getAdminOrders, updateAdminOrderStatus } from '@/api/admins';
import { getSuperAdminOrders } from '@/api/superadmins';
import { useAuth } from '@/contexts/AuthContext';
import { apiAdminOrderToOrder } from '@/utils/mapOrder';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';

const PAGE_SIZE = 10;

const STATUS_FILTERS: Array<OrderStatus | 'all'> = [
  'all',
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
];

/** Status chips at top (same order as backend enum). */
const STATUS_CHIPS: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function Orders() {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [statusModal, setStatusModal] = useState<{ open: boolean; order: Order | null }>({
    open: false,
    order: null,
  });

  const ordersQueryKey = isSuperAdmin
    ? (['superadmin', 'orders', page, PAGE_SIZE] as const)
    : (['admin', 'orders', page, PAGE_SIZE] as const);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ordersQueryKey,
    queryFn: async () => {
      const res = isSuperAdmin
        ? await getSuperAdminOrders({ page, limit: PAGE_SIZE })
        : await getAdminOrders({ page, limit: PAGE_SIZE });
      return {
        orders: res.orders.map(apiAdminOrderToOrder),
        pagination: res.pagination,
      };
    },
  });

  const orders = data?.orders ?? [];
  const pageMeta = data?.pagination;

  /** Counts for chip row — first 50 orders (same filter as list API). */
  const { data: chipCounts } = useQuery({
    queryKey: isSuperAdmin ? ['superadmin', 'orders', 'status-counts'] : ['admin', 'orders', 'status-counts'],
    queryFn: async () => {
      const res = isSuperAdmin
        ? await getSuperAdminOrders({ page: 1, limit: 50 })
        : await getAdminOrders({ page: 1, limit: 50 });
      const mapped = res.orders.map(apiAdminOrderToOrder);
      const counts: Record<OrderStatus, number> = {
        pending: 0,
        confirmed: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      };
      for (const o of mapped) {
        if (counts[o.status] != null) counts[o.status]++;
      }
      return counts;
    },
  });

  const getStatusCount = (status: OrderStatus) => chipCounts?.[status] ?? 0;

  const updateStatusMut = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      updateAdminOrderStatus(orderId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      qc.invalidateQueries({ queryKey: ['superadmin', 'orders'] });
      qc.invalidateQueries({ queryKey: ['admin', 'analytics'] });
      toast({ title: 'Order status updated' });
    },
    onError: (err) => {
      toast({
        title: err instanceof ApiError ? err.message : 'Failed to update status',
        variant: 'destructive',
      });
    },
  });

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const q = search.toLowerCase();
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(q) ||
        order.userName.toLowerCase().includes(q) ||
        order.userEmail.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const handleStatusSave = async (orderId: string, status: OrderStatus) => {
    await updateStatusMut.mutateAsync({ orderId, status });
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Orders"
        description={
          isSuperAdmin
            ? 'All platform orders (read-only).'
            : 'Orders that include your products — update status as needed.'
        }
      />

      {isError ? (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
          {error instanceof ApiError ? error.message : 'Failed to load orders.'}{' '}
          <Button variant="link" className="h-auto p-0" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : null}

      {/* Quick status chips — tap to filter */}
      <div className="mb-6 space-y-2">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {STATUS_CHIPS.map((status) => (
            <button
              key={status}
              type="button"
              className={`rounded-xl border p-4 text-left transition-all ${
                statusFilter === status
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
            >
              <Badge variant={status as never} className="mb-2 capitalize">
                {status}
              </Badge>
              <p className="text-2xl font-bold">{getStatusCount(status)}</p>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {isSuperAdmin
            ? 'Counts reflect up to the 50 most recent platform orders. The table is paginated separately.'
            : 'Counts reflect up to your 50 most recent orders. The table is paginated separately.'}
        </p>
      </div>

      {/* Filters — search/filters apply to the current page of results */}
      <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search this page…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'all' ? 'All status' : s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTableWrapper>
        {isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Loading orders…</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="h-8 w-8 text-muted-foreground" />}
            title="No orders found"
            description={
              isSuperAdmin
                ? 'No orders match your filters on this page, or there are no orders yet.'
                : 'No orders match your filters on this page, or there are no orders with your products yet.'
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                {/* <TableHead>Payment</TableHead> */}
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => (
                <TableRow key={order.id} className="animate-fade-in">
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.userName}</p>
                      <p className="text-sm text-muted-foreground">{order.userEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {order.items.slice(0, 2).map((item, idx) => (
                        <p key={item.id ?? idx} className="text-sm">
                          {item.quantity}× {item.productName}
                        </p>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-sm text-muted-foreground">+{order.items.length - 2} more</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    ₹{order.total.toLocaleString('en-IN')}
                  </TableCell>
                  {/* <TableCell>{order.paymentMethod}</TableCell> */}
                  <TableCell>
                    <Badge variant={order.status as never} className="capitalize">
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View details
                        </DropdownMenuItem>
                        {!isSuperAdmin ? (
                          <DropdownMenuItem onClick={() => setStatusModal({ open: true, order })}>
                            <Edit className="mr-2 h-4 w-4" />
                            Update status
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataTableWrapper>

      {pageMeta && pageMeta.totalPages > 1 ? (
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pageMeta.currentPage} of {pageMeta.totalPages} · {pageMeta.totalOrders} orders total
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!pageMeta.hasPrev || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!pageMeta.hasNext || isLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {!isSuperAdmin && statusModal.order ? (
        <OrderStatusModal
          open={statusModal.open}
          onOpenChange={(open) => setStatusModal({ ...statusModal, open })}
          orderId={statusModal.order.id}
          currentStatus={statusModal.order.status}
          onSave={handleStatusSave}
        />
      ) : null}
    </DashboardLayout>
  );
}
