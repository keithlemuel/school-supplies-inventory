import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";
import { getCurrentUser } from "@/features/auth/session";
import { categoryTree } from "@/features/inventory/categories";
import { getSettings, listCategories } from "@/features/inventory/queries";
import { AddCategoryForm, CategoryList, SettingsForm } from "@/features/settings/settings-forms";

export const metadata: Metadata = { title: "Settings" };

async function Content() {
  const user = await getCurrentUser();
  const [settings, categories] = await Promise.all([getSettings(), listCategories()]);
  const tree = categoryTree(categories);

  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid max-w-3xl gap-6">
        <section aria-labelledby="shop-heading" className="rounded-lg border bg-card p-4 sm:p-6">
          <h2 id="shop-heading" className="text-xl font-bold">
            When stock counts as old
          </h2>
          <p className="mt-1 mb-5 max-w-[65ch] text-muted-foreground">
            Stock age is counted from the date each delivery was received. These two numbers decide when a delivery is
            marked aging and when it is marked old.
          </p>
          <SettingsForm settings={settings} />
        </section>

        <section aria-labelledby="categories-heading" className="rounded-lg border bg-card p-4 sm:p-6">
          <h2 id="categories-heading" className="text-xl font-bold">
            Categories
          </h2>
          <p className="mt-1 mb-4 max-w-[65ch] text-muted-foreground">
            Groups for the item list, such as Notebooks or Paper. A main category can hold subcategories: Pens can
            hold Ballpens, Pencils and Markers.
          </p>
          <CategoryList tree={tree} />
          <AddCategoryForm mains={tree.map(({ id, name }) => ({ id, name }))} />
          <p className="mt-3 text-sm text-muted-foreground">
            Renaming a category renames it on every item. Deleting one keeps its items; they just lose the category, and
            its subcategories become main categories.
          </p>
        </section>

        <section aria-labelledby="account-heading" className="rounded-lg border bg-card p-4 sm:p-6">
          <h2 id="account-heading" className="text-xl font-bold">
            Your account
          </h2>
          <p className="mt-1 mb-4 text-muted-foreground">
            Signed in as {user.fullName} ({user.email}).
          </p>
          <form action={signOut}>
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </section>
      </div>
    </>
  );
}

// The data loads inside the boundary, so moving to this page shows its placeholder at once.
export default function SettingsPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content />
    </Suspense>
  );
}
