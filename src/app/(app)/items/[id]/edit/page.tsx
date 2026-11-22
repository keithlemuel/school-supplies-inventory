import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/page-loading";
import { getCurrentUser } from "@/features/auth/session";
import { categoryOptions } from "@/features/inventory/categories";
import { ItemForm } from "@/features/inventory/components/item-form";
import { getItem, listCategories, listUnitsByItem } from "@/features/inventory/queries";

export const metadata: Metadata = { title: "Edit item" };

async function Content({ params }: PageProps<"/items/[id]/edit">) {
  await getCurrentUser();
  const { id } = await params;
  const [item, categories, units] = await Promise.all([getItem(id), listCategories(), listUnitsByItem(id)]);
  if (!item) notFound();

  return (
    <>
      <PageHeader title={`Edit ${item.name}`} />
      <ItemForm item={item} units={units.get(id) ?? []} categories={categoryOptions(categories)} />
    </>
  );
}

// The data loads inside the boundary, so moving to this page shows its placeholder at once.
export default function EditItemPage(props: PageProps<"/items/[id]/edit">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content {...props} />
    </Suspense>
  );
}
