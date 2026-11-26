import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Printer } from "lucide-react";

import { SubmitButton } from "@/components/form";
import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/page-loading";
import { PrintButton } from "@/components/print-button";
import { getCurrentUser } from "@/features/auth/session";
import { setOrderPaid } from "@/features/deliveries/actions";
import { PaymentBadge } from "@/features/deliveries/components/payment-badge";
import { ReceiptSheet } from "@/features/deliveries/components/receipt-sheet";
import { getDeliveryReceipt } from "@/features/deliveries/queries";
import { count, date, money } from "@/lib/format";

export const metadata: Metadata = { title: "Delivery receipt" };

async function Content({ params }: PageProps<"/orders/[id]">) {
  await getCurrentUser();
  const { id } = await params;
  const receipt = await getDeliveryReceipt(id);
  if (!receipt) notFound();

  const fromStock = receipt.lines.filter((line) => line.fromStock).length;

  return (
    <>
      <div className="print:hidden">
        <p className="mb-2 text-sm">
          <Link href="/orders" className="font-medium text-link underline-offset-4 hover:underline">
            Orders
          </Link>
          <span className="text-muted-foreground"> / {receipt.customerName}</span>
        </p>
        <PageHeader
          title={`Delivery receipt ${receipt.number}`}
          description={`${count(fromStock)} of ${count(receipt.lines.length)} ${receipt.lines.length === 1 ? "line" : "lines"} came out of stock${receipt.by ? `. Recorded by ${receipt.by}` : ""}.`}
          actions={
            <PrintButton>
              <Printer /> Print or save as PDF
            </PrintButton>
          }
        />

        <form
          action={async () => {
            "use server";
            await setOrderPaid(receipt.id, !receipt.paidOn);
          }}
          className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg border bg-card px-4 py-3"
        >
          <PaymentBadge paid={Boolean(receipt.paidOn)} className="h-7 px-2.5 text-sm" />
          <p className="min-w-0 flex-1">
            {receipt.paidOn ? (
              <>
                Paid {date(receipt.paidOn)}
                {receipt.paidBy ? <span className="text-muted-foreground">, marked by {receipt.paidBy}</span> : null}.
              </>
            ) : (
              <>
                <strong className="tabular">{money(receipt.total)}</strong> still to collect from {receipt.customerName}.
              </>
            )}
          </p>
          {receipt.paidOn ? (
            <SubmitButton variant="ghost" size="sm" pendingLabel="Saving…">
              Mark as unpaid
            </SubmitButton>
          ) : (
            <SubmitButton variant="accent" pendingLabel="Saving…">
              Mark as paid
            </SubmitButton>
          )}
        </form>
      </div>

      {/* On screen the receipt sits on a sheet of paper; printing sends only the sheet. */}
      <div className="overflow-x-auto rounded-lg border bg-muted/60 p-4 sm:p-6 print:overflow-visible print:rounded-none print:border-0 print:bg-white print:p-0">
        <div className="mx-auto w-fit bg-white p-[8mm] shadow-[0_8px_30px_-12px_rgb(0_0_0/0.35)] print:p-0 print:shadow-none">
          <ReceiptSheet receipt={receipt} />
        </div>
      </div>
    </>
  );
}

// The data loads inside the boundary, so moving to this page shows its placeholder at once.
export default function OrderPage(props: PageProps<"/orders/[id]">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content {...props} />
    </Suspense>
  );
}
