import Link from "next/link";
import { cn } from "cn";

import { AgeBadge, AgeRuler } from "@/components/age";
import { LinkButton } from "@/components/link-button";
import { age, date, money, qty } from "@/lib/format";
import type { Batch, Settings } from "../queries";

/**
 * Deliveries that still have stock, oldest first, each with its age drawn on
 * the ruler. `showItem` adds the item name for shop-wide lists.
 */
export function BatchList({
  batches,
  settings,
  showItem = false,
  className,
}: {
  batches: Batch[];
  settings: Settings;
  showItem?: boolean;
  className?: string;
}) {
  return (
    <ul className={cn("divide-y rounded-lg border bg-card", className)}>
      {batches.map((batch) => (
        <li key={batch.id} className="grid gap-x-5 gap-y-2 px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              {showItem ? (
                <Link href={`/items/${batch.itemId}`} className="truncate font-semibold underline-offset-4 outline-none hover:underline focus-visible:underline">
                  {batch.itemName}
                </Link>
              ) : (
                <span className="font-semibold">Received {date(batch.receivedOn)}</span>
              )}
              <AgeBadge band={batch.ageBand} />
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {showItem ? `Received ${date(batch.receivedOn)}, ` : ""}
              {age(batch.ageDays)} {batch.ageDays > 0 ? "ago" : ""}
              {batch.supplier ? ` from ${batch.supplier}` : ""}
              {batch.unitCost != null ? `, ${money(batch.unitCost)} each` : ""}
            </p>
            <AgeRuler
              days={batch.ageDays}
              band={batch.ageBand}
              agingAfter={settings.agingAfterDays}
              oldAfter={settings.oldAfterDays}
              className="mt-2.5 max-w-md"
            />
          </div>
          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <p className="tabular leading-tight sm:text-right">
              <span className="block text-lg font-bold">{qty(batch.quantityRemaining, batch.unit)}</span>
              <span className="block text-sm text-muted-foreground">
                left of {qty(batch.quantityReceived, batch.unit)}
              </span>
            </p>
            <LinkButton
              href={`/stock-out?item=${batch.itemId}&batch=${batch.id}${batch.ageBand === "old" ? "&reason=disposed" : ""}`}
              variant="outline"
              size="sm"
            >
              Take out
            </LinkButton>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Explains the ruler once, above a list of batches. */
export function AgeLegend({ settings, className }: { settings: Settings; className?: string }) {
  return (
    <p className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground", className)}>
      <span className="flex items-center gap-1.5">
        <AgeBadge band="new" /> under {settings.agingAfterDays} days
      </span>
      <span className="flex items-center gap-1.5">
        <AgeBadge band="aging" /> {settings.agingAfterDays} to {settings.oldAfterDays - 1} days
      </span>
      <span className="flex items-center gap-1.5">
        <AgeBadge band="old" /> {settings.oldAfterDays} days or more
      </span>
    </p>
  );
}
