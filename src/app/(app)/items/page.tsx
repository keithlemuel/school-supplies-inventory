import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { cn } from "cn";

import { AgeBadge, bandForDays } from "@/components/age";
import { controlClass, selectClass } from "@/components/control-class";
import { Empty } from "@/components/empty";
import { LinkButton } from "@/components/link-button";
import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/session";
import { getSettings, listCategories, listItems, type ItemFilter } from "@/features/inventory/queries";
import { age, count, money, qty } from "@/lib/format";

export const metadata: Metadata = { title: "Items" };

const SHOW: { key: ItemFilter["show"]; label: string }[] = [
  { key: undefined, label: "All items" },
  { key: "low", label: "Running low" },
  { key: "old", label: "Has old stock" },
  { key: "out", label: "Out of stock" },
  { key: "archived", label: "Archived" },
];

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

async function Content({ searchParams }: PageProps<"/items">) {
  await getCurrentUser();
  const params = await searchParams;
  const q = one(params.q).trim();
  const category = one(params.category);
  const show = SHOW.find((option) => option.key === one(params.show))?.key;

  const [settings, categories, items] = await Promise.all([
    getSettings(),
    listCategories(),
    listItems({ q, category, show }),
  ]);
  const filtered = Boolean(q || category || show);

  const hrefFor = (key: ItemFilter["show"]) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (category) next.set("category", category);
    if (key) next.set("show", key);
    const query = next.toString();
    return query ? `/items?${query}` : "/items";
  };

  return (
    <>
      <PageHeader
        title="Items"
        description="Everything the shop sells, with what is on hand and how old the oldest of it is."
        actions={
          <LinkButton href="/items/new">
            <Plus /> Add item
          </LinkButton>
        }
      />

      <form className="flex flex-wrap gap-2">
        {show ? <input type="hidden" name="show" value={show} /> : null}
        <div className="relative min-w-52 flex-1 sm:max-w-sm">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Find an item by name or code"
            aria-label="Find an item by name or code"
            className={cn(controlClass, "h-10 pl-10")}
          />
        </div>
        <select name="category" defaultValue={category} aria-label="Category" className={cn(selectClass, "w-auto min-w-40")}>
          <option value="">All categories</option>
          {categories.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <nav aria-label="Filter items" className="mt-3 flex flex-wrap gap-1.5">
        {SHOW.map((option) => {
          const active = option.key === show;
          return (
            <Link
              key={option.label}
              href={hrefFor(option.key)}
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

      <div className="mt-5">
        {items.length === 0 ? (
          filtered ? (
            <Empty title="No items match" action={<LinkButton href="/items" variant="outline">Clear search and filters</LinkButton>}>
              Try a shorter name, or clear the filters.
            </Empty>
          ) : (
            <Empty title="No items yet" action={<LinkButton href="/items/new">Add your first item</LinkButton>}>
              Add each thing you sell once. After that you only record stock going in and out.
            </Empty>
          )
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-left text-[0.95rem]">
              <thead className="border-b text-sm text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Item</th>
                  <th className="px-4 py-2.5 text-right font-semibold">On hand</th>
                  <th className="px-4 py-2.5 font-semibold">Oldest stock</th>
                  <th className="hidden px-4 py-2.5 text-right font-semibold md:table-cell">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <Link href={`/items/${item.id}`} className="font-semibold underline-offset-4 outline-none hover:underline focus-visible:underline">
                        {item.name}
                      </Link>
                      <span className="block text-sm text-muted-foreground">
                        {[item.categoryName, item.sku].filter(Boolean).join(", ") || "No category"}
                      </span>
                    </td>
                    <td className="tabular px-4 py-3 text-right whitespace-nowrap">
                      <span className={cn("block font-bold", item.onHand === 0 && "text-old")}>{qty(item.onHand, item.unit)}</span>
                      {item.isLow ? <span className="block text-sm font-semibold text-aging">Running low</span> : null}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.oldestAgeDays == null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <AgeBadge band={bandForDays(item.oldestAgeDays, settings.agingAfterDays, settings.oldAfterDays)} />
                          <span className="tabular text-sm text-muted-foreground">
                            {age(item.oldestAgeDays)}
                            {item.oldQuantity > 0 ? `, ${count(item.oldQuantity)} old` : ""}
                          </span>
                        </span>
                      )}
                    </td>
                    <td className="tabular hidden px-4 py-3 text-right whitespace-nowrap md:table-cell">{money(item.sellingPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {items.length > 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {count(items.length)} {items.length === 1 ? "item" : "items"}
          </p>
        ) : null}
      </div>
    </>
  );
}

// The data loads inside the boundary, so moving to this page shows its placeholder at once.
export default function ItemsPage(props: PageProps<"/items">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content {...props} />
    </Suspense>
  );
}
