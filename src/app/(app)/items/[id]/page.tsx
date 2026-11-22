import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PackageMinus, PackagePlus, Pencil } from "lucide-react";

import { Empty } from "@/components/empty";
import { LinkButton } from "@/components/link-button";
import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/session";
import { setItemArchived } from "@/features/inventory/actions";
import { AgeLegend, BatchList } from "@/features/inventory/components/batch-list";
import { MovementsTable } from "@/features/inventory/components/movements-table";
import { getItem, getSettings, listMovements, listOpenBatches } from "@/features/inventory/queries";
import { count, money, qty } from "@/lib/format";

export const metadata: Metadata = { title: "Item" };

async function Content({ params }: PageProps<"/items/[id]">) {
  await getCurrentUser();
  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();

  const [settings, batches, history] = await Promise.all([
    getSettings(),
    listOpenBatches({ itemId: id }),
    listMovements({ itemId: id, limit: 20 }),
  ]);

  const facts = [
    { label: "On hand", value: qty(item.onHand, item.unit) },
    { label: "Old stock", value: qty(item.oldQuantity, item.unit), alert: item.oldQuantity > 0 },
    { label: "Value at cost", value: money(item.stockValue) },
    { label: "Selling price", value: money(item.sellingPrice) },
  ];

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/items" className="font-medium text-link underline-offset-4 hover:underline">
          Items
        </Link>
        <span className="text-muted-foreground"> / {item.categoryName ?? "No category"}</span>
      </p>
      <PageHeader
        title={item.name}
        description={
          [
            item.sku ? `Code ${item.sku}` : null,
            item.reorderLevel > 0 ? `Warns at ${count(item.reorderLevel)} ${item.unit}` : null,
            item.notes,
          ]
            .filter(Boolean)
            .join(". ") || undefined
        }
        actions={
          item.isArchived ? null : (
            <>
              <LinkButton href={`/stock-in?item=${item.id}`} variant="accent">
                <PackagePlus /> Stock in
              </LinkButton>
              <LinkButton href={`/stock-out?item=${item.id}`}>
                <PackageMinus /> Stock out
              </LinkButton>
              <LinkButton href={`/items/${item.id}/edit`} variant="outline">
                <Pencil /> Edit
              </LinkButton>
            </>
          )
        }
      />

      {item.isArchived ? (
        <p className="mb-5 rounded-md border border-aging/35 bg-aging/10 px-3 py-2 text-sm font-medium text-aging">
          This item is archived. It is hidden from the item list and the stock forms.
        </p>
      ) : item.isLow ? (
        <p className="mb-5 rounded-md border border-aging/35 bg-aging/10 px-3 py-2 text-sm font-medium text-aging">
          Running low: {qty(item.onHand, item.unit)} left, and the warning is set at {count(item.reorderLevel)}.
        </p>
      ) : null}

      <dl className="grid grid-cols-2 overflow-hidden rounded-lg border bg-card lg:grid-cols-4">
        {facts.map((fact, index) => (
          <div
            key={fact.label}
            className={`px-4 py-3 ${index % 2 === 1 ? "border-l" : ""} ${index >= 2 ? "border-t lg:border-t-0" : ""} lg:border-l lg:first:border-l-0`}
          >
            <dt className="text-sm font-medium text-muted-foreground">{fact.label}</dt>
            <dd className={`tabular mt-0.5 font-heading text-2xl font-bold ${fact.alert ? "text-old" : ""}`}>{fact.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="batches-heading" className="mt-8">
        <h2 id="batches-heading" className="text-xl font-bold">
          On the shelf, oldest first
        </h2>
        <p className="mt-1 mb-3 text-muted-foreground">
          Each delivery is kept apart. Stock out uses up the one at the top before touching the next.
        </p>
        {batches.length > 0 ? (
          <>
            <BatchList batches={batches} settings={settings} />
            <AgeLegend settings={settings} className="mt-3" />
          </>
        ) : (
          <Empty
            title="None on hand"
            action={
              item.isArchived ? null : (
                <LinkButton href={`/stock-in?item=${item.id}`} variant="accent">
                  Record stock in
                </LinkButton>
              )
            }
          >
            Record a delivery to put this item back on the shelf.
          </Empty>
        )}
      </section>

      <section aria-labelledby="history-heading" className="mt-8">
        <h2 id="history-heading" className="mb-3 text-xl font-bold">
          History
        </h2>
        {history.rows.length > 0 ? (
          <>
            <MovementsTable rows={history.rows} showItem={false} />
            {history.hasMore ? <p className="mt-2 text-sm text-muted-foreground">Showing the latest 20 entries.</p> : null}
          </>
        ) : (
          <Empty title="No stock recorded for this item yet" />
        )}
      </section>

      <form
        action={async () => {
          "use server";
          await setItemArchived(item.id, !item.isArchived);
        }}
        className="mt-10 border-t pt-5"
      >
        <Button type="submit" variant="outline" size="sm">
          {item.isArchived ? "Restore this item" : "Archive this item"}
        </Button>
        <p className="mt-1.5 max-w-[60ch] text-sm text-muted-foreground">
          {item.isArchived
            ? "Restoring puts it back in the item list."
            : "For things you no longer sell. Archiving hides the item but keeps its history."}
        </p>
      </form>
    </>
  );
}

// The data loads inside the boundary, so moving to this page shows its placeholder at once.
export default function ItemPage(props: PageProps<"/items/[id]">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content {...props} />
    </Suspense>
  );
}
