import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/page-loading";
import { getCurrentUser } from "@/features/auth/session";
import { OrderForm } from "@/features/deliveries/components/order-form";
import { listCustomers } from "@/features/deliveries/queries";
import { listItems, listUnitsByItem } from "@/features/inventory/queries";
import { todayInManila } from "@/lib/format";

export const metadata: Metadata = { title: "New order" };

async function Content() {
  await getCurrentUser();
  const [items, units, customers] = await Promise.all([listItems(), listUnitsByItem(), listCustomers()]);

  return (
    <>
      <PageHeader
        title="New order"
        description="Who it is for and what they are getting. Saving takes the items out of stock, oldest first, and makes the delivery receipt."
      />
      <OrderForm
        today={todayInManila()}
        customers={customers}
        items={items.map((item) => ({
          id: item.id,
          name: item.name,
          unit: item.unit,
          price: item.sellingPrice,
          onHand: item.onHand,
          units: (units.get(item.id) ?? []).map(({ id, name, contains, price }) => ({ id, name, contains, price })),
        }))}
      />
    </>
  );
}

// The data loads inside the boundary, so moving to this page shows its placeholder at once.
export default function NewOrderPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content />
    </Suspense>
  );
}
