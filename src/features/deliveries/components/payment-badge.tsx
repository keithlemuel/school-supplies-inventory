import { Check } from "lucide-react";
import { cn } from "cn";

/** "Paid" in the green of fresh stock, "Unpaid" in the amber of aging stock: owed, not yet a problem. */
export function PaymentBadge({ paid, className }: { paid: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-sm border px-2 text-xs font-bold",
        paid ? "border-fresh/35 bg-fresh/8 text-fresh" : "border-aging/35 bg-aging/10 text-aging",
        className,
      )}
    >
      {paid ? <Check aria-hidden strokeWidth={3} className="size-3.5" /> : null}
      {paid ? "Paid" : "Unpaid"}
    </span>
  );
}
