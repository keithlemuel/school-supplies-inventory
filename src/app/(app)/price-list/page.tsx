import type { Metadata } from "next";
import { Suspense } from "react";
import { Download, FileText } from "lucide-react";

import { BrandMark } from "@/components/brand";
import { Empty } from "@/components/empty";
import { LinkButton } from "@/components/link-button";
import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/page-loading";
import { PrintButton } from "@/components/print-button";
import { Select } from "@/components/select";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/session";
import { categoryOptions, categorySelectOptions } from "@/features/inventory/categories";
import { PriceCell } from "@/features/inventory/components/price-cell";
import { getPriceList, pricedOnly, type PriceGroup } from "@/features/inventory/price-list";
import { listCategories } from "@/features/inventory/queries";
import { count, date, money, todayInManila } from "@/lib/format";
import { SHOP_NAME } from "@/lib/shop";

export const metadata: Metadata = { title: "Price list" };

async function Content({ searchParams }: PageProps<"/price-list">) {
  await getCurrentUser();
  const params = await searchParams;
  const requested = typeof params.category === "string" ? params.category : "";

  const options = categoryOptions(await listCategories());
  const chosen = options.find((option) => option.id === requested);
  const groups = await getPriceList(chosen?.id);
  const forCustomer = pricedOnly(groups);

  const lines = groups.flatMap((group) => group.items.flatMap((item) => item.lines));
  const missing = lines.filter((line) => line.price == null).length;
  const exportHref = chosen ? `/price-list/export?category=${chosen.id}` : "/price-list/export";

  return (
    <>
      {/* On screen: the working list, where prices are changed. */}
      <div className="print:hidden">
        <PageHeader
          title="Price list"
          description="What each item sells for, in every unit it comes in. Save it as a PDF or a spreadsheet to send to a customer."
          actions={
            forCustomer.length > 0 ? (
              <>
                <PrintButton>
                  <FileText /> Save as PDF
                </PrintButton>
                {/* A plain link, not a router link: the browser downloads the file. */}
                <a
                  href={exportHref}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-input bg-white px-4 text-[0.95rem] font-semibold outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                  <Download className="size-4" /> Download spreadsheet
                </a>
              </>
            ) : null
          }
        />

        <form className="flex flex-wrap gap-2">
          <Select
            name="category"
            defaultValue={chosen?.id ?? ""}
            aria-label="Category"
            options={categorySelectOptions(options, "All categories")}
            className="w-auto min-w-48"
          />
          <Button type="submit" variant="outline">
            Show
          </Button>
        </form>

        {lines.length > 0 ? (
          <p className="mt-3 max-w-[70ch] text-sm text-muted-foreground">
            Saving as PDF opens the print window: choose “Save as PDF” there. The PDF and the spreadsheet list only what
            is shown here
            {missing > 0 ? (
              <>
                , and leave out the <strong className="text-aging">{count(missing)} without a price</strong>
              </>
            ) : null}
            . Stock counts and costs are never included.
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-6">
          {groups.length === 0 ? (
            chosen ? (
              <Empty title="No items in this category" action={<LinkButton href="/price-list" variant="outline">Show all categories</LinkButton>} />
            ) : (
              <Empty title="No items yet" action={<LinkButton href="/items/new">Add your first item</LinkButton>}>
                Items appear here with their prices once you add them.
              </Empty>
            )
          ) : (
            groups.map((group) => (
              <section key={group.category} aria-label={group.category}>
                <h2 className="mb-2 text-lg font-bold">{group.category}</h2>
                <div className="overflow-x-auto rounded-lg border bg-card">
                  <table className="w-full text-left text-[0.95rem]">
                    <thead className="border-b text-sm text-muted-foreground">
                      <tr>
                        <th className="w-[45%] px-4 py-2 font-semibold">Item</th>
                        <th className="px-4 py-2 font-semibold">Unit</th>
                        <th className="px-4 py-2 text-right font-semibold">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((item) =>
                        item.lines.map((line, index) => (
                          <tr key={line.id} className={index === 0 ? "border-t first:border-t-0" : ""}>
                            <td className="px-4 py-1.5 align-middle font-medium">
                              {index === 0 ? (
                                <a href={`/items/${item.id}`} className="underline-offset-4 outline-none hover:underline focus-visible:underline">
                                  {item.name}
                                </a>
                              ) : null}
                            </td>
                            <td className="px-4 py-1.5 whitespace-nowrap text-muted-foreground">{line.unit}</td>
                            <td className="px-2 py-1.5 whitespace-nowrap">
                              <PriceCell line={line} label={`${item.name}, per ${line.unit}`} />
                            </td>
                          </tr>
                        )),
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            ))
          )}
        </div>
      </div>

      {/* On paper or PDF: the clean copy for the customer. */}
      <CustomerCopy groups={forCustomer} category={chosen?.label} />
    </>
  );
}

function CustomerCopy({ groups, category }: { groups: PriceGroup[]; category?: string }) {
  return (
    <div className="hidden text-black print:block">
      <header className="flex items-end justify-between gap-6 border-b-2 border-black pb-3">
        <div className="flex items-center gap-3">
          <BrandMark className="size-12" />
          <div>
            <p className="font-heading text-2xl leading-tight font-bold">{SHOP_NAME}</p>
            <p className="text-sm">Price list{category ? `: ${category}` : ""}</p>
          </div>
        </div>
        <p className="text-right text-sm">Prices as of {date(todayInManila())}</p>
      </header>

      {groups.map((group) => (
        <section key={group.category} className="mt-5">
          <h2 className="break-after-avoid border-b border-black/40 pb-1 font-heading text-base font-bold">{group.category}</h2>
          <table className="w-full text-left text-[0.9rem]">
            <tbody>
              {group.items.map((item) =>
                item.lines.map((line, index) => (
                  <tr key={line.id} className="break-inside-avoid border-b border-black/10">
                    <td className="w-[55%] py-1 pr-3 font-medium">{index === 0 ? item.name : null}</td>
                    <td className="py-1 pr-3">per {line.unit}</td>
                    <td className="tabular py-1 text-right font-semibold">{money(line.price)}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </section>
      ))}

      <p className="mt-6 text-xs">Prices may change without notice. Please confirm before ordering.</p>
    </div>
  );
}

// The data loads inside the boundary, so moving to this page shows its placeholder at once.
export default function PriceListPage(props: PageProps<"/price-list">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content {...props} />
    </Suspense>
  );
}
