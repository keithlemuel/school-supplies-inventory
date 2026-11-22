import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { cn } from "cn";

import { Empty } from "@/components/empty";
import { SubmitButton } from "@/components/form";
import { LinkButton } from "@/components/link-button";
import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/page-loading";
import { getCurrentUser } from "@/features/auth/session";
import { setOrderPaid } from "@/features/deliveries/actions";
import { PaymentBadge } from "@/features/deliveries/components/payment-badge";
import { getUnpaidSummary, listDeliveryReceipts, type PaymentFilter } from "@/features/deliveries/queries";
import { count, date, money } from "@/lib/format";

export const metadata: Metadata = { title: "Orders" };

const SHOW: { key: PaymentFilter | undefined; label: string }[] = [
  { key: undefined, label: "All orders" },
  { key: "unpaid", label: "Unpaid" },
  { key: "paid", label: "Paid" },
];

async function Content({ searchParams }: PageProps<"/orders">) {
  await getCurrentUser();
  const params = await searchParams;
  const payment = SHOW.find((option) => option.key && option.key === params.show)?.key;
  const [receipts, unpaid] = await Promise.all([listDeliveryReceipts({ payment }), getUnpaidSummary()]);

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

      {unpaid.count > 0 ? (
        <p className="mb-4 flex flex-wrap items-baseline gap-x-2 rounded-md border border-aging/30 bg-aging/8 px-4 py-3">
          <strong className="tabular font-heading text-xl text-aging">{money(unpaid.total)}</strong>
          <span>
            still to collect from {count(unpaid.count)} unpaid {unpaid.count === 1 ? "order" : "orders"}.
          </span>
        </p>
      ) : null}

      {receipts.length > 0 || payment ? (
        <nav aria-label="Filter orders" className="mb-4 flex flex-wrap gap-1.5">
          {SHOW.map((option) => {
            const active = option.key === payment;
            return (
              <Link
                key={option.label}
                href={option.key ? `/orders?show=${option.key}` : "/orders"}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex h-8 items-center rounded-full border px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40",
                  active ? "border-board bg-board text-white" : "border-input bg-white hover:bg-muted",
                )}
              >
                {option.label}
              </Link>
            );
          })}
        </nav>
      ) : null}

      {receipts.length === 0 && payment ? (
        <Empty title={payment === "unpaid" ? "Every order is paid" : "No paid orders yet"} action={<LinkButton href="/orders" variant="outline">Show all orders</LinkButton>}>
          {payment === "unpaid" ? "Nothing left to collect." : "Mark an order paid once the customer settles it."}
        </Empty>
      ) : receipts.length === 0 ? (
        <Empty title="No orders yet" action={<LinkButton href="/orders/new">Make the first order</LinkButton>}>
          When a school or office orders, list what they are getting. The items come off the stock and the delivery
          receipt is made for you.
        </Empty>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full min-w-[44rem] text-left text-[0.95rem]">
            <thead className="border-b text-sm whitespace-nowrap text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Delivery No.</th>
                <th className="px-4 py-2.5 font-semibold">Date</th>
                <th className="px-4 py-2.5 font-semibold">Sold to</th>
                <th className="px-4 py-2.5 text-right font-semibold">Items</th>
                <th className="px-4 py-2.5 text-right font-semibold">Total</th>
                <th className="px-4 py-2.5 font-semibold">Payment</th>
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
                  <td className="px-4 py-2">
                    {receipt.paidOn ? (
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <PaymentBadge paid />
                        <span className="tabular text-sm whitespace-nowrap text-muted-foreground">{date(receipt.paidOn)}</span>
                      </span>
                    ) : (
                      <form
                        action={async () => {
                          "use server";
                          await setOrderPaid(receipt.id, true);
                        }}
                        className="flex items-center gap-2"
                      >
                        <PaymentBadge paid={false} />
                        <SubmitButton variant="outline" size="sm" pendingLabel="Saving…" className="h-7 px-2.5">
                          Mark paid
                        </SubmitButton>
                      </form>
                    )}
                  </td>
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
export default function OrdersPage(props: PageProps<"/orders">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content {...props} />
    </Suspense>
  );
}
