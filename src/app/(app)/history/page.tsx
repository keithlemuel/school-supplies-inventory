import type { Metadata } from "next";
import { Suspense } from "react";

import { Empty } from "@/components/empty";
import { LinkButton } from "@/components/link-button";
import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/page-loading";
import { Select } from "@/components/select";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/session";
import { MovementsTable } from "@/features/inventory/components/movements-table";
import { listMovements } from "@/features/inventory/queries";
import { IN_REASONS, OUT_REASONS } from "@/features/inventory/reasons";

export const metadata: Metadata = { title: "History" };

const REASONS: Record<string, string> = { ...IN_REASONS, ...OUT_REASONS, recount: "Recount" };

async function Content({ searchParams }: PageProps<"/history">) {
  await getCurrentUser();
  const params = await searchParams;
  const direction = params.direction === "in" || params.direction === "out" ? params.direction : undefined;
  const reason = typeof params.reason === "string" && params.reason in REASONS ? params.reason : undefined;
  const page = Math.max(1, Number.parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1);

  const { rows, hasMore } = await listMovements({ direction, reason, page });

  const hrefFor = (target: number) => {
    const next = new URLSearchParams();
    if (direction) next.set("direction", direction);
    if (reason) next.set("reason", reason);
    if (target > 1) next.set("page", String(target));
    const query = next.toString();
    return query ? `/history?${query}` : "/history";
  };

  return (
    <>
      <PageHeader title="History" description="Every quantity that went in or out, newest first, and who recorded it." />

      <form className="flex flex-wrap gap-2">
        <Select
          name="direction"
          defaultValue={direction ?? ""}
          aria-label="In or out"
          options={[
            { value: "", label: "In and out" },
            { value: "in", label: "Stock in only" },
            { value: "out", label: "Stock out only" },
          ]}
          className="w-auto min-w-36"
        />
        <Select
          name="reason"
          defaultValue={reason ?? ""}
          aria-label="Reason"
          options={[{ value: "", label: "Any reason" }, ...Object.entries(REASONS).map(([value, label]) => ({ value, label }))]}
          className="w-auto min-w-44"
        />
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <div className="mt-5">
        {rows.length > 0 ? (
          <MovementsTable rows={rows} />
        ) : direction || reason || page > 1 ? (
          <Empty title="Nothing matches" action={<LinkButton href="/history" variant="outline">Show everything</LinkButton>} />
        ) : (
          <Empty title="No stock recorded yet" action={<LinkButton href="/stock-in" variant="accent">Record stock in</LinkButton>}>
            Deliveries and stock taken out are listed here as you record them.
          </Empty>
        )}
      </div>

      {page > 1 || hasMore ? (
        <div className="mt-4 flex items-center gap-2">
          {page > 1 ? (
            <LinkButton href={hrefFor(page - 1)} variant="outline" size="sm">
              Newer
            </LinkButton>
          ) : null}
          {hasMore ? (
            <LinkButton href={hrefFor(page + 1)} variant="outline" size="sm">
              Older
            </LinkButton>
          ) : null}
          <span className="text-sm text-muted-foreground">Page {page}</span>
        </div>
      ) : null}
    </>
  );
}

// The data loads inside the boundary, so moving to this page shows its placeholder at once.
export default function HistoryPage(props: PageProps<"/history">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Content {...props} />
    </Suspense>
  );
}
