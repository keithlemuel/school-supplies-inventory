import "server-only";

import { listItems, listUnitsByItem } from "./queries";
import { unitLabel } from "./units";

/** One price: an item in one of its units. `kind` says which table the price lives in. */
export type PriceLine = { id: string; kind: "item" | "unit"; unit: string; price: number | null };
export type PriceItem = { id: string; name: string; lines: PriceLine[] };
export type PriceGroup = { category: string; items: PriceItem[] };

const NO_CATEGORY = "Other items";

/**
 * Every item with a price line for its smallest unit and one for each bigger
 * unit, grouped by category. Pass a category id to narrow it (a main category
 * includes its subcategories).
 */
export async function getPriceList(category?: string): Promise<PriceGroup[]> {
  const [items, units] = await Promise.all([listItems({ category }), listUnitsByItem()]);

  const groups = new Map<string, PriceItem[]>();
  for (const item of items) {
    const lines: PriceLine[] = [
      { id: item.id, kind: "item", unit: item.unit, price: item.sellingPrice },
      ...(units.get(item.id) ?? []).map((unit) => ({
        id: unit.id,
        kind: "unit" as const,
        unit: unitLabel(unit, item.unit),
        price: unit.price,
      })),
    ];
    const key = item.categoryName ?? NO_CATEGORY;
    groups.set(key, [...(groups.get(key) ?? []), { id: item.id, name: item.name, lines }]);
  }

  return [...groups.entries()]
    .map(([name, groupItems]) => ({ category: name, items: groupItems }))
    .sort((a, b) =>
      a.category === NO_CATEGORY ? 1 : b.category === NO_CATEGORY ? -1 : a.category.localeCompare(b.category),
    );
}

/** The list a customer gets: only the lines that have a price, and only the items that still have a line. */
export function pricedOnly(groups: PriceGroup[]): PriceGroup[] {
  return groups
    .map((group) => ({
      category: group.category,
      items: group.items
        .map((item) => ({ ...item, lines: item.lines.filter((line) => line.price != null) }))
        .filter((item) => item.lines.length > 0),
    }))
    .filter((group) => group.items.length > 0);
}
