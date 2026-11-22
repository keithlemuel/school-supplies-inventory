import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";

import { Empty } from "@/components/empty";
import { LinkButton } from "@/components/link-button";
import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/page-loading";
import { getCurrentUser } from "@/features/auth/session";
import { listDeliveryReceipts } from "@/features/deliveries/queries";
import { count, date, money } from "@/lib/format";

export const metadata: Metadata = { title: "Orders" };

async function Content() {
  await getCurrentUser();
  const receipts = await listDeliveryReceipts();

  return (
    <>
      <PageHeader
        title="Orders"
        description="What customers ordered and were given. Each order has its delivery receipt, ready to print."
        actions={
          <LinkButton href="/orders/new">
            <Plus /> New order
          </LinkButton>
        }
      />

      {receipts.length === 0 ? (
        <Empty title="No orders yet" action={<LinkButton href="/orders/new">Make the first order</LinkButton>}>
          When a school or office orders, list what they are getting. The items come off the stock and the delivery
          receipt is made for you.
        </Empty>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full min-w-[34rem] text-left text-[0.95rem]">
            <thead className="border-b text-sm text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Delivery No.</th>
                <th className="px-4 py-2.5 font-semibold">Date</th>
                <th className="px-4 py-2.5 font-semibold">Sold to</th>
                <th className="px-4 py-2.5 text-right font-semibold">Items</th>
                <th className="px-4 py-2.5 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {receipts.map((receipt) => (
                <tr key={receipt.id} className="hover:bg-muted/50">
                  <td className="tabular px-4 py-3">
                    <Link href={`/orders/${receipt.id}`} className="font-semibold text-link underline-offset-4 outline-none hover:underline focus-visible:underline">
                      {receipt.number}
                    </Link>
                  </td>
                  <td className="tabular px-4 py-3 whitespace-nowrap">{date(receipt.deliveredOn)}</td>
                  <td className="px-4 py-3 font-medium">{receipt.customerName}</td>
                  <td className="tabular px-4 py-3 text-right">{count(receipt.lineCount)}</td>
                  <td className="tabular px-4 py-3 text-right font-semibold whitespace-nowrap">{money(receipt.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// The data loads inside the boundary, so moving to this page shows its placeholder at once.
export default function OrdersPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content />
    </Suspense>
  );
}
