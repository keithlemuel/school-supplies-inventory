import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/page-loading";
import { getCurrentUser } from "@/features/auth/session";
import { ItemForm } from "@/features/inventory/components/item-form";
import { listCategories } from "@/features/inventory/queries";

export const metadata: Metadata = { title: "Add item" };

async function Content() {
  await getCurrentUser();
  const categories = await listCategories();
  return (
    <>
      <PageHeader title="Add item" description="Add the item once. Stock is recorded separately, each time a delivery arrives." />
      <ItemForm categories={categories} />
    </>
  );
}

// The data loads inside the boundary, so moving to this page shows its placeholder at once.
export default function NewItemPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content />
    </Suspense>
  );
}
