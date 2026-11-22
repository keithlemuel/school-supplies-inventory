import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";
import { getCurrentUser } from "@/features/auth/session";
import { getSettings, listCategories } from "@/features/inventory/queries";
import { deleteCategory } from "@/features/settings/actions";
import { AddCategoryForm, SettingsForm } from "@/features/settings/settings-forms";

export const metadata: Metadata = { title: "Settings" };

async function Content() {
  const user = await getCurrentUser();
  const [settings, categories] = await Promise.all([getSettings(), listCategories()]);

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
          <p className="mt-1 mb-4 text-muted-foreground">Groups for the item list, such as Notebooks, Pens or Paper.</p>
          {categories.length > 0 ? (
            <ul className="mb-5 divide-y rounded-md border">
              {categories.map((category) => (
                <li key={category.id} className="flex items-center justify-between gap-3 py-1.5 pr-1.5 pl-3">
                  <span className="font-medium">{category.name}</span>
                  <form
                    action={async () => {
                      "use server";
                      await deleteCategory(category.id);
                    }}
                  >
                    <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                      Delete<span className="sr-only"> {category.name}</span>
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          ) : null}
          <AddCategoryForm />
          <p className="mt-3 text-sm text-muted-foreground">Deleting a category keeps its items; they just lose the category.</p>
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
