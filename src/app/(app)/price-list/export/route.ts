import type { NextRequest } from "next/server";

import { getPriceList, pricedOnly } from "@/features/inventory/price-list";
import { todayInManila } from "@/lib/format";
import { SHOP_NAME } from "@/lib/shop";

/** One spreadsheet cell. Quoted when needed, and never allowed to start a formula. */
function cell(value: string | number): string {
  const text = typeof value === "number" ? value.toFixed(2) : /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** The price list as a spreadsheet file (CSV), for sending to a customer. Only lines with a price. */
export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category") ?? undefined;
  const groups = pricedOnly(await getPriceList(category));
  const today = todayInManila();

  const rows: (string | number)[][] = [
    [`${SHOP_NAME} price list`, "", "", `Prices as of ${today}`],
    [],
    ["Category", "Item", "Unit", "Price (PHP)"],
  ];
  for (const group of groups) {
    for (const item of group.items) {
      for (const line of item.lines) {
        rows.push([group.category, item.name, line.unit, line.price ?? 0]);
      }
    }
  }

  // The leading mark tells Excel the file is UTF-8, so names with ñ or é open correctly.
  const csv = "﻿" + rows.map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
  const slug = SHOP_NAME.toLowerCase().replace(/'/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-price-list-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
