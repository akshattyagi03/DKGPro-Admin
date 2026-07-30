import { useMemo, useState } from 'react';
import { Search, Download, Send, MoreHorizontal, Eye, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
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
import {
  getAdminOrders,
  openAdminInvoiceInBrowser,
  downloadAdminInvoicePdf,
  sendAdminInvoiceToCustomer,
  type ApiAdminOrder,
} from '@/api/admins';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';

const LIST_LIMIT = 50;

const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

type BillingBucket = 'paid' | 'pending' | 'overdue' | 'cancelled';

function mapOrderToBucket(o: ApiAdminOrder): BillingBucket {
  const s = o.status.toLowerCase();
  if (s === 'cancelled') return 'cancelled';
  if (s === 'pending') {
    const days = (Date.now() - new Date(o.createdAt).getTime()) / 86_400_000;
    return days > 7 ? 'overdue' : 'pending';
  }
  if (['confirmed', 'shipped', 'delivered'].includes(s)) return 'paid';
  return 'pending';
}

function dueDateIso(o: ApiAdminOrder): string {
  const d = new Date(o.createdAt);
  d.setDate(d.getDate() + 7);
  return d.toISOString();
}

function invoiceNumberFromOrder(o: ApiAdminOrder) {
  const tail = o.orderNumber.replace(/^ORD-/i, '');
  return `INV-${tail}`;
}

export default function Billing() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [busyKind, setBusyKind] = useState<'download' | 'send' | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'orders', 'billing', LIST_LIMIT],
    queryFn: () => getAdminOrders({ page: 1, limit: LIST_LIMIT }),
  });

  const rows = useMemo(() => {
    const orders = data?.orders ?? [];
    return orders.map((o) => ({
      order: o,
      bucket: mapOrderToBucket(o),
      invoiceNumber: invoiceNumberFromOrder(o),
      dueDate: dueDateIso(o),
    }));
  }, [data?.orders]);

  const filtered = useMemo(() => {
    return rows.filter(({ order, bucket, invoiceNumber }) => {
      const matchesSearch =
        invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        order.userName.toLowerCase().includes(search.toLowerCase()) ||
        order.userEmail.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || bucket === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const totals = useMemo(() => {
    let paid = 0;
    let pending = 0;
    let overdue = 0;
    for (const { order, bucket } of rows) {
      if (bucket === 'cancelled') continue;
      const t = order.myTotal;
      if (bucket === 'paid') paid += t;
      else if (bucket === 'pending') pending += t;
      else if (bucket === 'overdue') overdue += t;
    }
    const count = (b: BillingBucket) => rows.filter((r) => r.bucket === b).length;
    return {
      paid,
      pending,
      overdue,
      paidCount: count('paid'),
      pendingCount: count('pending'),
      overdueCount: count('overdue'),
    };
  }, [rows]);

  const handleView = (orderId: string) => {
    openAdminInvoiceInBrowser(orderId);
  };

  const handleDownload = async (orderId: string) => {
    setBusyOrderId(orderId);
    setBusyKind('download');
    try {
      await downloadAdminInvoicePdf(orderId);
      toast({ title: 'Download started', description: 'Invoice PDF is being saved.' });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not download invoice.';
      toast({ title: 'Download failed', description: msg, variant: 'destructive' });
    } finally {
      setBusyOrderId(null);
      setBusyKind(null);
    }
  };

  const handleSendInvoice = async (orderId: string) => {
    setBusyOrderId(orderId);
    setBusyKind('send');
    try {
      const res = await sendAdminInvoiceToCustomer(orderId);
      toast({
        title: 'Invoice send requested',
        description: `Order ${res.orderNumber}. Email: ${res.results.email ?? '—'}. WhatsApp: ${res.results.whatsapp ?? '—'}.`,
      });
      void refetch();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not send invoice.';
      toast({ title: 'Send failed', description: msg, variant: 'destructive' });
    } finally {
      setBusyOrderId(null);
      setBusyKind(null);
    }
  };

  const badgeVariant = (bucket: BillingBucket) => {
    if (bucket === 'cancelled') return 'cancelled' as const;
    if (bucket === 'paid') return 'paid' as const;
    if (bucket === 'overdue') return 'overdue' as const;
    return 'pending' as const;
  };

  const errMessage = isError && error instanceof Error ? error.message : 'Failed to load orders.';

  return (
    <DashboardLayout>
      <PageHeader
        title="Billing System"
        description="Manage invoices and billing for your orders"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-6 rounded-xl bg-success/10 border border-success/20">
          <p className="text-sm font-medium text-success mb-1">Paid Invoices</p>
          <p className="text-2xl font-bold text-success">{inr(totals.paid)}</p>
          <p className="text-sm text-muted-foreground mt-1">{totals.paidCount} orders</p>
        </div>
        <div className="p-6 rounded-xl bg-warning/10 border border-warning/20">
          <p className="text-sm font-medium text-warning mb-1">Pending Invoices</p>
          <p className="text-2xl font-bold text-warning">{inr(totals.pending)}</p>
          <p className="text-sm text-muted-foreground mt-1">{totals.pendingCount} orders</p>
        </div>
        <div className="p-6 rounded-xl bg-destructive/10 border border-destructive/20">
          <p className="text-sm font-medium text-destructive mb-1">Overdue Invoices</p>
          <p className="text-2xl font-bold text-destructive">{inr(totals.overdue)}</p>
          <p className="text-sm text-muted-foreground mt-1">{totals.overdueCount} orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
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
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTableWrapper>
        {isLoading ? (
          <p className="p-8 text-center text-muted-foreground">Loading invoices…</p>
        ) : isError ? (
          <p className="p-8 text-center text-destructive">{errMessage}</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-8 h-8 text-muted-foreground" />}
            title="No invoices found"
            description="No orders match your search criteria."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(({ order, bucket, invoiceNumber, dueDate }) => {
                const busy = busyOrderId === order.id;
                return (
                  <TableRow key={order.id} className="animate-fade-in">
                    <TableCell className="font-medium">{invoiceNumber}</TableCell>
                    <TableCell className="text-muted-foreground">{order.orderNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.userName}</p>
                        <p className="text-sm text-muted-foreground">{order.userEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{inr(order.myTotal)}</TableCell>
                    <TableCell>
                      <Badge variant={badgeVariant(bucket)} className="capitalize">
                        {bucket}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(dueDate).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={busy}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(order.id)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Invoice
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={busy && busyKind === 'download'}
                            onClick={() => handleDownload(order.id)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            {busy && busyKind === 'download' ? 'Downloading…' : 'Download PDF'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={busy && busyKind === 'send'}
                            onClick={() => handleSendInvoice(order.id)}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            {busy && busyKind === 'send' ? 'Sending…' : 'Send to Customer'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DataTableWrapper>
    </DashboardLayout>
  );
}
