import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/page-loading";
import { getCurrentUser } from "@/features/auth/session";
import { ItemForm } from "@/features/inventory/components/item-form";
import { getItem, listCategories } from "@/features/inventory/queries";

export const metadata: Metadata = { title: "Edit item" };

async function Content({ params }: PageProps<"/items/[id]/edit">) {
  await getCurrentUser();
  const { id } = await params;
  const [item, categories] = await Promise.all([getItem(id), listCategories()]);
  if (!item) notFound();

  return (
    <>
      <PageHeader title={`Edit ${item.name}`} />
      <ItemForm item={item} categories={categories} />
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
