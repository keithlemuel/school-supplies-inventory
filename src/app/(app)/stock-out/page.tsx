import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/page-loading";
import { getCurrentUser } from "@/features/auth/session";
import { StockOutForm, type BatchChoice } from "@/features/inventory/components/stock-forms";
import { listItemOptions, listOpenBatches } from "@/features/inventory/queries";
import { OUT_REASONS } from "@/features/inventory/reasons";
import { todayInManila } from "@/lib/format";

export const metadata: Metadata = { title: "Stock out" };

async function Content({ searchParams }: PageProps<"/stock-out">) {
  await getCurrentUser();
  const params = await searchParams;
  const items = await listItemOptions();

  const requested = typeof params.item === "string" ? params.item : undefined;
  const itemId = items.some((item) => item.id === requested) ? requested : undefined;
  const reason = typeof params.reason === "string" && params.reason in OUT_REASONS ? params.reason : undefined;

  // Arriving from a particular delivery ("Take out" on a batch) takes from that one.
  let batch: BatchChoice | undefined;
  if (itemId && typeof params.batch === "string") {
    const found = (await listOpenBatches({ itemId })).find((candidate) => candidate.id === params.batch);
    if (found) {
      batch = { id: found.id, itemId, receivedOn: found.receivedOn, quantityRemaining: found.quantityRemaining };
    }
  }

  return (
    <>
      <PageHeader
        title="Stock out"
        description="Record what left the shelf: sold, damaged, given away or disposed. The oldest delivery is used up first."
      />
      <div className="max-w-2xl rounded-lg border bg-card p-4 sm:p-6">
        <StockOutForm
          // A different item or delivery in the address starts the form over.
          key={`${itemId ?? ""}:${batch?.id ?? ""}`}
          items={items}
          today={todayInManila()}
          defaultItemId={itemId}
          defaultReason={reason}
          batch={batch}
        />
      </div>
    </>
  );
}

// The data loads inside the boundary, so moving to this page shows its placeholder at once.
export default function StockOutPage(props: PageProps<"/stock-out">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content {...props} />
    </Suspense>
  );
}
