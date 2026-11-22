import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/page-loading";
import { getCurrentUser } from "@/features/auth/session";
import { StockInForm } from "@/features/inventory/components/stock-forms";
import { listItemOptions } from "@/features/inventory/queries";
import { todayInManila } from "@/lib/format";

export const metadata: Metadata = { title: "Stock in" };

async function Content({ searchParams }: PageProps<"/stock-in">) {
  await getCurrentUser();
  const params = await searchParams;
  const items = await listItemOptions();
  const requested = typeof params.item === "string" ? params.item : undefined;

  return (
    <>
      <PageHeader
        title="Stock in"
        description="Record what arrived. Each entry is saved as its own delivery with its date, so new stock never gets mixed up with what was already on the shelf."
      />
      <div className="max-w-2xl rounded-lg border bg-card p-4 sm:p-6">
        <StockInForm
          items={items}
          today={todayInManila()}
          defaultItemId={items.some((item) => item.id === requested) ? requested : undefined}
        />
      </div>
    </>
  );
}

// The data loads inside the boundary, so moving to this page shows its placeholder at once.
export default function StockInPage(props: PageProps<"/stock-in">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content {...props} />
    </Suspense>
  );
}
