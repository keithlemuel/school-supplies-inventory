import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Printer } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/page-loading";
import { PrintButton } from "@/components/print-button";
import { getCurrentUser } from "@/features/auth/session";
import { ReceiptSheet } from "@/features/deliveries/components/receipt-sheet";
import { getDeliveryReceipt } from "@/features/deliveries/queries";
import { count } from "@/lib/format";

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
