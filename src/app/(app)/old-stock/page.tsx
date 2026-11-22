import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { cn } from "cn";

import { Empty } from "@/components/empty";
import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/page-loading";
import { getCurrentUser } from "@/features/auth/session";
import { AgeLegend, BatchList } from "@/features/inventory/components/batch-list";
import { getSettings, listOpenBatches, type Batch } from "@/features/inventory/queries";
import { count, money } from "@/lib/format";

export const metadata: Metadata = { title: "Old stock" };

const TABS = [
  { key: "old", label: "Old" },
  { key: "aging", label: "Aging" },
  { key: "all", label: "Everything on the shelf" },
] as const;
type Tab = (typeof TABS)[number]["key"];

async function Content({ searchParams }: PageProps<"/old-stock">) {
  await getCurrentUser();
  const params = await searchParams;
  const tab: Tab = TABS.find((option) => option.key === params.show)?.key ?? "old";

  const [settings, batches] = await Promise.all([getSettings(), listOpenBatches()]);
  const inBand = (band: Batch["ageBand"]) => batches.filter((batch) => batch.ageBand === band);
  const shown = tab === "all" ? batches : inBand(tab);
  const counts: Record<Tab, number> = { old: inBand("old").length, aging: inBand("aging").length, all: batches.length };

  const units = shown.reduce((sum, batch) => sum + batch.quantityRemaining, 0);
  const value = shown.reduce((sum, batch) => sum + batch.remainingValue, 0);

  return (
    <>
      <PageHeader
        title="Old stock"
        description="Deliveries that have sat the longest, oldest at the top. Sell these first, mark them down, or take them out as disposed."
      />

      <nav aria-label="Age of stock" className="flex flex-wrap gap-1.5">
        {TABS.map((option) => {
          const active = option.key === tab;
          return (
            <Link
              key={option.key}
              href={option.key === "old" ? "/old-stock" : `/old-stock?show=${option.key}`}
              aria-current={active ? "true" : undefined}
              className={cn(
                "flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40",
                active ? "border-board bg-board text-white" : "border-input bg-white hover:bg-muted",
              )}
            >
              {option.label}
              <span className={cn("tabular text-xs font-bold", active ? "text-white/75" : "text-muted-foreground")}>
                {count(counts[option.key])}
              </span>
            </Link>
          );
        })}
      </nav>

      <AgeLegend settings={settings} className="mt-4" />

      <div className="mt-4">
        {shown.length > 0 ? (
          <>
            <p className="tabular mb-3 font-medium">
              {count(shown.length)} {shown.length === 1 ? "delivery" : "deliveries"}, {count(units)} units, worth{" "}
              {money(value)} at cost
            </p>
            <BatchList batches={shown} settings={settings} showItem />
          </>
        ) : tab === "old" ? (
          <Empty title="No old stock">
            Nothing on the shelf has been there {settings.oldAfterDays} days or more. Change that number in Settings if
            it does not fit how fast your stock moves.
          </Empty>
        ) : tab === "aging" ? (
          <Empty title="No aging stock">
            Nothing on the shelf is between {settings.agingAfterDays} and {settings.oldAfterDays - 1} days old.
          </Empty>
        ) : (
          <Empty title="The shelf is empty">Record a delivery under Stock in to see it here.</Empty>
        )}
      </div>
    </>
  );
}

// The data loads inside the boundary, so moving to this page shows its placeholder at once.
export default function OldStockPage(props: PageProps<"/old-stock">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content {...props} />
    </Suspense>
  );
}
