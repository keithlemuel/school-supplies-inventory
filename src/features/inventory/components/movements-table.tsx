import Link from "next/link";
import { cn } from "cn";

import { date, qty } from "@/lib/format";
import type { Movement } from "../queries";
import { reasonLabel } from "../reasons";

/** The stock ledger: one line per quantity that went in or out. */
export function MovementsTable({ rows, showItem = true }: { rows: Movement[]; showItem?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full min-w-[34rem] text-left text-[0.95rem]">
        <thead className="border-b text-sm text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 font-semibold">Date</th>
            {showItem ? <th className="px-4 py-2.5 font-semibold">Item</th> : null}
            <th className="px-4 py-2.5 text-right font-semibold">Quantity</th>
            <th className="px-4 py-2.5 font-semibold">Reason</th>
            <th className="px-4 py-2.5 font-semibold">From delivery of</th>
            <th className="px-4 py-2.5 font-semibold">By</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="tabular px-4 py-2.5 whitespace-nowrap">{date(row.occurredOn)}</td>
              {showItem ? (
                <td className="px-4 py-2.5">
                  <Link href={`/items/${row.itemId}`} className="font-medium underline-offset-4 outline-none hover:underline focus-visible:underline">
                    {row.itemName}
                  </Link>
                </td>
              ) : null}
              <td
                className={cn(
                  "tabular px-4 py-2.5 text-right font-bold whitespace-nowrap",
                  row.direction === "in" ? "text-fresh" : "text-foreground",
                )}
              >
                {row.direction === "in" ? "+" : "−"}
                {qty(row.quantity, row.unit)}
              </td>
              <td className="px-4 py-2.5">
                {reasonLabel(row.direction, row.reason)}
                {row.note ? <span className="block text-sm text-muted-foreground">{row.note}</span> : null}
              </td>
              <td className="tabular px-4 py-2.5 whitespace-nowrap text-muted-foreground">{date(row.batchReceivedOn)}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{row.by ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
