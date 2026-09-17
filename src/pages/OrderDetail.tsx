import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Hash,
  Mail,
  MapPin,
  Package,
  Phone,
  User,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/PageComponents';
import { OrderStatusProgress } from '@/components/orders/OrderStatusProgress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { OrderStatusModal } from '@/components/modals/FormModals';
import { OrderStatus } from '@/types';
import { getAdminOrder, updateAdminOrderStatus, type ApiAdminOrder, type ApiAdminOrderItem } from '@/api/admins';
import { getSuperAdminOrder } from '@/api/superadmins';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';
import {
  formatBalloonColorLine,
  formatMoneyInr,
  formatOrderDate,
  giftCardDisplayRows,
  lineAddonsTotal,
  lineGrandTotal,
  linePackageTotal,
  shippingAddressRows,
  sortAddonLines,
  sumLineGrandTotals,
} from '@/utils/orderDisplay';
import { useState } from 'react';

function MetaItem({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: typeof Hash;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={`mt-0.5 text-sm text-foreground ${mono ? 'break-all font-mono text-xs' : ''}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function OrderLineItem({ line, index }: { line: ApiAdminOrderItem; index: number }) {
  const img = line.product?.images?.[0];
  const name = line.product?.name ?? 'Product';
  const listPrice = line.product?.price;
  const sortedAddons = sortAddonLines(line.bookingAddonLines);
  const packageTotal = linePackageTotal(line);
  const addonsTotal = lineAddonsTotal(line);
  const grandTotal = lineGrandTotal(line);
  const balloonColors = formatBalloonColorLine(line.bookingDetails?.balloonColorChoice);
  const giftCardRows = giftCardDisplayRows(line.bookingDetails?.giftCardChoice);
  const booking = line.bookingDetails;

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row">
        {img ? (
          <img
            src={img}
            alt=""
            className="h-24 w-24 shrink-0 rounded-lg border object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border bg-muted text-xs text-muted-foreground">
            No image
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Item {index + 1}
              </p>
              <p className="text-base font-semibold text-foreground">{name}</p>
            </div>
            <p className="text-base font-bold text-primary">{formatMoneyInr(grandTotal)}</p>
          </div>

          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-md bg-muted/30 px-3 py-2">
              <p className="text-xs text-muted-foreground">Package</p>
              <p className="font-medium text-foreground">
                Qty {line.quantity} × {formatMoneyInr(line.price)} = {formatMoneyInr(packageTotal)}
              </p>
            </div>
            {addonsTotal > 0 ? (
              <div className="rounded-md bg-muted/30 px-3 py-2">
                <p className="text-xs text-muted-foreground">Add-ons total</p>
                <p className="font-medium text-foreground">{formatMoneyInr(addonsTotal)}</p>
              </div>
            ) : null}
          </div>

          {listPrice != null && listPrice !== line.price ? (
            <p className="text-xs text-muted-foreground">
              Catalog MRP: {formatMoneyInr(listPrice)}
            </p>
          ) : null}

          {sortedAddons.length > 0 ? (
            <div className="rounded-lg border bg-muted/20 p-3 text-sm">
              <p className="mb-2 font-medium text-foreground">
                Selected add-ons ({formatMoneyInr(addonsTotal)})
              </p>
              <ul className="space-y-1.5">
                {sortedAddons.map((addon, addonIdx) => (
                  <li
                    key={`${addon.addonName}-${addonIdx}`}
                    className="flex flex-wrap items-start justify-between gap-x-3 gap-y-0.5"
                  >
                    <span className="text-foreground">
                      <span className="text-muted-foreground">[{addon.sectionName ?? '—'}]</span>{' '}
                      {addon.addonName ?? '—'}
                      {addon.quantity != null && addon.quantity > 1 ? ` × ${addon.quantity}` : ''}
                    </span>
                    {addon.lineTotal != null ? (
                      <span className="shrink-0 font-medium">{formatMoneyInr(addon.lineTotal)}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {booking?.bookingDate || booking?.pincode || balloonColors || giftCardRows.length ? (
            <div className="rounded-lg border border-dashed bg-muted/10 p-3 text-sm">
              <p className="mb-2 font-medium text-foreground">Service booking</p>
              <dl className="space-y-1.5">
                {balloonColors ? (
                  <div className="grid gap-1 sm:grid-cols-[6.5rem_1fr]">
                    <dt className="text-muted-foreground">Balloon colors</dt>
                    <dd className="font-medium text-foreground">{balloonColors}</dd>
                  </div>
                ) : null}
                {giftCardRows.map((row) => (
                  <div key={row.label} className="grid gap-1 sm:grid-cols-[6.5rem_1fr]">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="font-medium text-foreground">{row.value}</dd>
                  </div>
                ))}
                {booking.bookingDate ? (
                  <div className="grid gap-1 sm:grid-cols-[6.5rem_1fr]">
                    <dt className="text-muted-foreground">Date</dt>
                    <dd className="text-foreground">{booking.bookingDate}</dd>
                  </div>
                ) : null}
                {booking.startTime ? (
                  <div className="grid gap-1 sm:grid-cols-[6.5rem_1fr]">
                    <dt className="text-muted-foreground">Time</dt>
                    <dd className="text-foreground">
                      {booking.startTime}
                      {booking.endTime ? ` – ${booking.endTime}` : ''}
                    </dd>
                  </div>
                ) : null}
                {booking.pincode ? (
                  <div className="grid gap-1 sm:grid-cols-[6.5rem_1fr]">
                    <dt className="text-muted-foreground">Service area</dt>
                    <dd className="text-foreground">
                      PIN {booking.pincode}
                      {booking.district ? ` · ${booking.district}` : ''}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function OrderDetail() {
  const { isSuperAdmin } = useAuth();
  const { orderId } = useParams<{ orderId: string }>();
  const qc = useQueryClient();
  const [statusOpen, setStatusOpen] = useState(false);

  const orderQueryKey = isSuperAdmin
    ? (['superadmin', 'order', orderId] as const)
    : (['admin', 'order', orderId] as const);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: orderQueryKey,
    queryFn: async () =>
      isSuperAdmin
        ? (await getSuperAdminOrder(orderId!)).order
        : (await getAdminOrder(orderId!)).order,
    enabled: Boolean(orderId),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      updateAdminOrderStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'order', orderId] });
      qc.invalidateQueries({ queryKey: ['superadmin', 'order', orderId] });
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      qc.invalidateQueries({ queryKey: ['superadmin', 'orders'] });
      qc.invalidateQueries({ queryKey: ['admin', 'analytics'] });
      toast({ title: 'Order status updated' });
      setStatusOpen(false);
    },
    onError: (err) => {
      toast({
        title: err instanceof ApiError ? err.message : 'Failed to update status',
        variant: 'destructive',
      });
    },
  });

  const order = data as ApiAdminOrder | undefined;
  const addressRows = shippingAddressRows(order?.shippingAddress);
  const linesSubtotal = order ? sumLineGrandTotals(order.items) : 0;
  const packageSubtotal = order
    ? order.items.reduce((sum, line) => sum + linePackageTotal(line), 0)
    : 0;
  const addonsSubtotal = order
    ? order.items.reduce((sum, line) => sum + lineAddonsTotal(line), 0)
    : 0;

  if (!orderId) {
    return (
      <DashboardLayout>
        <p className="text-sm text-muted-foreground">Invalid order.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-4 gap-1 pl-0" asChild>
          <Link to="/orders">
            <ArrowLeft className="h-4 w-4" />
            Back to orders
          </Link>
        </Button>
        <PageHeader
          title={order?.orderNumber ?? 'Order details'}
          description="Review customer, delivery address, add-ons, and booking schedule."
        >
          {order && !isSuperAdmin ? (
            <Button type="button" size="sm" onClick={() => setStatusOpen(true)}>
              Update status
            </Button>
          ) : null}
        </PageHeader>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-36 animate-pulse rounded-xl bg-muted" />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-40 animate-pulse rounded-xl bg-muted" />
            <div className="h-40 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
          {error instanceof ApiError ? error.message : 'Failed to load order.'}{' '}
          <Button variant="link" className="h-auto p-0" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : order ? (
        <div className="space-y-6">
          <Card className="overflow-hidden border-primary/15 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-6 py-4">
              <div>
                <p className="text-sm text-muted-foreground">Order reference</p>
                <p className="text-xl font-bold text-foreground">{order.orderNumber}</p>
              </div>
              <Badge variant={order.status as never} className="capitalize">
                {order.status}
              </Badge>
            </div>
            <CardContent className="grid gap-3 pt-6 sm:grid-cols-2 xl:grid-cols-4">
              <MetaItem icon={Hash} label="Order ID" value={String(order.id)} mono />
              <MetaItem
                icon={Calendar}
                label="Placed on"
                value={formatOrderDate(order.createdAt)}
              />
              <MetaItem
                icon={Calendar}
                label="Last updated"
                value={formatOrderDate(order.updatedAt)}
              />
              <MetaItem
                icon={CreditCard}
                label="Payment ID"
                value={order.razorpayPaymentId || '—'}
                mono
              />
            </CardContent>
          </Card>

          <OrderStatusProgress status={order.status} />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4 text-primary" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{order.userName}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="break-all">{order.userEmail}</span>
                </div>
                {order.userPhone ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{order.userPhone}</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4 text-primary" />
                  Delivery address
                </CardTitle>
              </CardHeader>
              <CardContent>
                {addressRows.length > 0 ? (
                  <dl className="space-y-2 text-sm">
                    {addressRows.map((row) => (
                      <div key={row.label} className="grid gap-1 sm:grid-cols-[6.5rem_1fr]">
                        <dt className="font-medium text-muted-foreground">{row.label}</dt>
                        <dd className="text-foreground">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </CardContent>
            </Card>
          </div>

          {order.razorpayOrderId ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Payment reference
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <MetaItem
                  icon={CreditCard}
                  label="Razorpay order"
                  value={order.razorpayOrderId}
                  mono
                />
                <MetaItem
                  icon={CreditCard}
                  label="Razorpay payment"
                  value={order.razorpayPaymentId || '—'}
                  mono
                />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4 text-primary" />
                {isSuperAdmin ? 'Line items' : 'Line items (your products)'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((line, idx) => (
                <OrderLineItem key={line._id ?? idx} line={line} index={idx} />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Package subtotal</span>
                <span className="font-medium">{formatMoneyInr(packageSubtotal)}</span>
              </div>
              {addonsSubtotal > 0 ? (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Add-ons subtotal</span>
                  <span className="font-medium">{formatMoneyInr(addonsSubtotal)}</span>
                </div>
              ) : null}
              <Separator />
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {isSuperAdmin ? 'Items subtotal' : 'Your lines subtotal'}
                </span>
                <span className="font-semibold text-foreground">{formatMoneyInr(linesSubtotal)}</span>
              </div>
              <div className="flex justify-between gap-4 rounded-lg bg-primary/5 px-3 py-3">
                <span className="font-medium text-foreground">Full order total</span>
                <span className="text-lg font-bold text-primary">
                  {formatMoneyInr(order.orderTotal)}
                </span>
              </div>
              {!isSuperAdmin && order.orderTotal !== linesSubtotal ? (
                <p className="text-xs text-muted-foreground">
                  Full order may include other sellers’ products or fees not shown in your lines.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {order && !isSuperAdmin ? (
        <OrderStatusModal
          open={statusOpen}
          onOpenChange={setStatusOpen}
          orderId={String(order.id)}
          currentStatus={order.status as OrderStatus}
          onSave={async (id, status) => {
            await updateMut.mutateAsync({ id, status });
          }}
        />
      ) : null}
    </DashboardLayout>
  );
}
