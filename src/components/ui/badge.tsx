import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-success/10 text-success",
        warning:
          "border-transparent bg-warning/10 text-warning",
        info:
          "border-transparent bg-info/10 text-info",
        pending:
          "border-transparent bg-warning/10 text-warning",
        confirmed:
          "border-transparent bg-info/10 text-info",
        shipped:
          "border-transparent bg-primary/10 text-primary",
        delivered:
          "border-transparent bg-success/10 text-success",
        cancelled:
          "border-transparent bg-destructive/10 text-destructive",
        active:
          "border-transparent bg-success/10 text-success",
        inactive:
          "border-transparent bg-muted text-muted-foreground",
        suspended:
          "border-transparent bg-destructive/10 text-destructive",
        draft:
          "border-transparent bg-muted text-muted-foreground",
        published:
          "border-transparent bg-success/10 text-success",
        archived:
          "border-transparent bg-muted text-muted-foreground",
        paid:
          "border-transparent bg-success/10 text-success",
        overdue:
          "border-transparent bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
