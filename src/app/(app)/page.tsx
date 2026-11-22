import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";

import { Empty } from "@/components/empty";
import { LinkButton } from "@/components/link-button";
import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/page-loading";
import { getCurrentUser } from "@/features/auth/session";
import { AgeLegend, BatchList } from "@/features/inventory/components/batch-list";
import { MovementsTable } from "@/features/inventory/components/movements-table";
import { getSettings, listItems, listMovements, listOpenBatches } from "@/features/inventory/queries";
import { count, money, qty } from "@/lib/format";

export const metadata: Metadata = { title: "Overview" };

async function Content() {
  await getCurrentUser();
  const [settings, items, oldest, recent] = await Promise.all([
    getSettings(),
    listItems(),
    listOpenBatches({ bands: ["old", "aging"], limit: 6 }),
    listMovements({ limit: 8 }),
  ]);

  if (items.length === 0) {
    return (
      <>
        <PageHeader title="Overview" />
        <Empty
          title="Start by adding the items you sell"
          action={<LinkButton href="/items/new">Add your first item</LinkButton>}
        >
          Add each item once, then record stock coming in. Every delivery keeps its date, which is how the app tells
          old stock from new.
        </Empty>
      </>
    );
  }

  const low = items.filter((item) => item.isLow).sort((a, b) => a.onHand - b.onHand);
  const units = items.reduce((sum, item) => sum + item.onHand, 0);
  const value = items.reduce((sum, item) => sum + item.stockValue, 0);
  const oldUnits = items.reduce((sum, item) => sum + item.oldQuantity, 0);
  const itemsWithOld = items.filter((item) => item.oldQuantity > 0).length;

  const facts = [
    { label: "Items in stock", value: count(items.filter((item) => item.onHand > 0).length), detail: `of ${count(items.length)} items` },
    { label: "Units on hand", value: count(units), detail: `worth ${money(value)} at cost` },
    { label: "Running low", value: count(low.length), detail: low.length === 1 ? "item to reorder" : "items to reorder", href: "/items?show=low" },
    { label: "Old stock", value: count(oldUnits), detail: `units across ${count(itemsWithOld)} ${itemsWithOld === 1 ? "item" : "items"}`, href: "/old-stock", alert: oldUnits > 0 },
  ];

  return (
    <>
      <PageHeader title="Overview" description="What is on the shelf today, and what should leave it first." />

      <dl className="grid grid-cols-2 overflow-hidden rounded-lg border bg-card lg:grid-cols-4">
        {facts.map((fact, index) => (
          <div
            key={fact.label}
            className={`px-4 py-3.5 ${index % 2 === 1 ? "border-l" : ""} ${index >= 2 ? "border-t lg:border-t-0" : ""} lg:border-l lg:first:border-l-0`}
          >
            <dt className="text-sm font-medium text-muted-foreground">{fact.label}</dt>
            <dd className="mt-0.5">
              <span className={`tabular font-heading text-[1.7rem] leading-none font-bold ${fact.alert ? "text-old" : ""}`}>
                {fact.value}
              </span>
              {fact.href ? (
                <Link href={fact.href} className="mt-1 block text-sm text-link underline-offset-4 hover:underline">
                  {fact.detail}
                </Link>
              ) : (
                <span className="mt-1 block text-sm text-muted-foreground">{fact.detail}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,3fr)]">
        <section aria-labelledby="oldest-heading">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="oldest-heading" className="text-xl font-bold">
              Sell or clear these first
            </h2>
            <Link href="/old-stock" className="text-sm font-medium text-link underline-offset-4 hover:underline">
              See all old stock
            </Link>
          </div>
          {oldest.length > 0 ? (
            <>
              <BatchList batches={oldest} settings={settings} showItem />
              <AgeLegend settings={settings} className="mt-3" />
            </>
          ) : (
            <Empty title="Nothing is getting old">
              Every delivery on the shelf is under {settings.agingAfterDays} days old.
            </Empty>
          )}
        </section>

        <section aria-labelledby="low-heading">
          <h2 id="low-heading" className="mb-3 text-xl font-bold">
            Running low
          </h2>
          {low.length > 0 ? (
            <ul className="divide-y rounded-lg border bg-card">
              {low.slice(0, 8).map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/items/${item.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 outline-none hover:bg-muted/60 focus-visible:bg-muted"
                  >
                    <span className="min-w-0 truncate font-medium">{item.name}</span>
                    <span className="tabular shrink-0 text-right text-sm leading-tight">
                      <strong className={`block text-base ${item.onHand === 0 ? "text-old" : ""}`}>
                        {item.onHand === 0 ? "Out of stock" : `${qty(item.onHand, item.unit)} left`}
                      </strong>
                      <span className="text-muted-foreground">warn at {count(item.reorderLevel)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="Nothing is running low">Items appear here when they fall to their warning number.</Empty>
          )}
        </section>
      </div>

      <section aria-labelledby="recent-heading" className="mt-8">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="recent-heading" className="text-xl font-bold">
            Latest stock in and out
          </h2>
          <Link href="/history" className="text-sm font-medium text-link underline-offset-4 hover:underline">
            See full history
          </Link>
        </div>
        {recent.rows.length > 0 ? (
          <MovementsTable rows={recent.rows} />
        ) : (
          <Empty title="No stock recorded yet" action={<LinkButton href="/stock-in" variant="accent">Record stock in</LinkButton>}>
            Record your first delivery to see it here.
          </Empty>
        )}
      </section>
    </>
  );
}

// The data loads inside the boundary, so moving to this page shows its placeholder at once.
export default function OverviewPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content />
    </Suspense>
  );
}
