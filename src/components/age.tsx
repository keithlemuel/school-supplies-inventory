import { cn } from "cn";

import { age } from "@/lib/format";

export type AgeBand = "new" | "aging" | "old";

const BAND: Record<AgeBand, { label: string; text: string; fill: string; tint: string }> = {
  new: { label: "New", text: "text-fresh", fill: "bg-fresh", tint: "border-fresh/35 bg-fresh/8" },
  aging: { label: "Aging", text: "text-aging", fill: "bg-aging", tint: "border-aging/35 bg-aging/10" },
  old: { label: "Old", text: "text-old", fill: "bg-old", tint: "border-old/35 bg-old/8" },
};

export function toBand(value: string | null | undefined): AgeBand {
  return value === "old" || value === "aging" ? value : "new";
}

/** Which band a number of days falls in, for places that only know the oldest age. */
export function bandForDays(days: number | null | undefined, agingAfter: number, oldAfter: number): AgeBand {
  if (days == null) return "new";
  return days >= oldAfter ? "old" : days >= agingAfter ? "aging" : "new";
}

/** "Old", "Aging" or "New", marked the way a pen would mark a box. */
export function AgeBadge({ band, className }: { band: AgeBand; className?: string }) {
  const style = BAND[band];
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-sm border px-2 text-xs font-bold",
        style.tint,
        style.text,
        className,
      )}
    >
      {style.label}
    </span>
  );
}

/**
 * How long a batch has been sitting, drawn on a ruler. The ruler is twelve
 * marks long and ends at twice the "old" threshold, so the two notches (where
 * aging and old begin) sit in the same place on every row.
 */
export function AgeRuler({
  days,
  band,
  agingAfter,
  oldAfter,
  className,
}: {
  days: number;
  band: AgeBand;
  agingAfter: number;
  oldAfter: number;
  className?: string;
}) {
  const span = oldAfter * 2;
  const percent = (value: number) => `${Math.min(100, Math.max(0, (value / span) * 100))}%`;
  return (
    <div
      role="img"
      aria-label={`${age(days)} in stock`}
      className={cn("relative h-2.5 w-full overflow-hidden rounded-[3px] bg-muted", className)}
    >
      <div className={cn("absolute inset-y-0 left-0", BAND[band].fill)} style={{ width: percent(Math.max(days, span / 60)) }} />
      <div className="ruler-ticks absolute inset-0" />
      <div className="absolute inset-y-0 w-0.5 bg-foreground/55" style={{ left: percent(agingAfter) }} />
      <div className="absolute inset-y-0 w-0.5 bg-foreground/80" style={{ left: percent(oldAfter) }} />
    </div>
  );
}
