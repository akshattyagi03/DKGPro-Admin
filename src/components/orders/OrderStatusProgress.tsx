import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { OrderStatus } from '@/types';

const FLOW: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered'];

function stepIndex(status: string): number {
  const idx = FLOW.indexOf(status as OrderStatus);
  return idx >= 0 ? idx : 0;
}

const DESCRIPTIONS: Record<OrderStatus, string> = {
  pending: 'Payment received — awaiting your confirmation.',
  confirmed: 'Booking confirmed — preparation in progress.',
  shipped: 'Team is on the way or setup is in progress.',
  delivered: 'Decoration completed and delivered.',
  cancelled: 'This order has been cancelled.',
};

type OrderStatusProgressProps = {
  status: string;
};

export function OrderStatusProgress({ status }: OrderStatusProgressProps) {
  const normalized = status as OrderStatus;
  const activeIndex = stepIndex(status);
  const isCancelled = normalized === 'cancelled';

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">Fulfillment status</p>
        <Badge variant={normalized as never} className="capitalize">
          {status}
        </Badge>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        {DESCRIPTIONS[normalized] ?? 'Track where this booking sits in the fulfillment flow.'}
      </p>

      {isCancelled ? (
        <p className="text-xs text-destructive">
          This order is no longer active in the fulfillment flow.
        </p>
      ) : (
        <ol className="grid grid-cols-4 gap-2">
          {FLOW.map((step, index) => {
            const isComplete = index <= activeIndex;
            const isCurrent = index === activeIndex;
            return (
              <li key={step} className="flex min-w-0 flex-col items-center text-center">
                <span
                  className={cn(
                    'mb-1.5 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                    isComplete
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {index + 1}
                </span>
                <span
                  className={cn(
                    'text-[11px] font-medium capitalize leading-tight',
                    isComplete ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step}
                </span>
                {isCurrent ? (
                  <span className="mt-1 h-1 w-1 rounded-full bg-primary" aria-hidden />
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
