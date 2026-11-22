import "server-only";

import { createClient } from "@/lib/supabase/server";

export type Settings = { agingAfterDays: number; oldAfterDays: number };

export async function getSettings(): Promise<Settings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settings")
    .select("aging_after_days, old_after_days")
    .single();
  if (error) throw new Error(`Could not load settings: ${error.message}`);
  return { agingAfterDays: data.aging_after_days, oldAfterDays: data.old_after_days };
}

export async function listCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("id, name").order("name");
  if (error) throw new Error(`Could not load categories: ${error.message}`);
  return data;
}

const ITEM_COLUMNS =
  "id, name, sku, unit, category_id, category_name, selling_price, reorder_level, notes, is_archived, on_hand, old_quantity, aging_quantity, stock_value, oldest_received_on, oldest_age_days, open_batches, is_low";

/** One row of the item_stock view. Views report every column as nullable; these never are. */
export type ItemStock = {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  categoryId: string | null;
  categoryName: string | null;
  sellingPrice: number | null;
  reorderLevel: number;
  notes: string | null;
  isArchived: boolean;
  onHand: number;
  oldQuantity: number;
  agingQuantity: number;
  stockValue: number;
  oldestReceivedOn: string | null;
  oldestAgeDays: number | null;
  openBatches: number;
  isLow: boolean;
};

type ItemStockRow = {
  id: string | null;
  name: string | null;
  sku: string | null;
  unit: string | null;
  category_id: string | null;
  category_name: string | null;
  selling_price: number | null;
  reorder_level: number | null;
  notes: string | null;
  is_archived: boolean | null;
  on_hand: number | null;
  old_quantity: number | null;
  aging_quantity: number | null;
  stock_value: number | null;
  oldest_received_on: string | null;
  oldest_age_days: number | null;
  open_batches: number | null;
  is_low: boolean | null;
};

function toItem(row: ItemStockRow): ItemStock {
  return {
    id: row.id ?? "",
    name: row.name ?? "",
    sku: row.sku,
    unit: row.unit ?? "pc",
    categoryId: row.category_id,
    categoryName: row.category_name,
    sellingPrice: row.selling_price,
    reorderLevel: row.reorder_level ?? 0,
    notes: row.notes,
    isArchived: row.is_archived ?? false,
    onHand: row.on_hand ?? 0,
    oldQuantity: row.old_quantity ?? 0,
    agingQuantity: row.aging_quantity ?? 0,
    stockValue: Number(row.stock_value ?? 0),
    oldestReceivedOn: row.oldest_received_on,
    oldestAgeDays: row.oldest_age_days,
    openBatches: row.open_batches ?? 0,
    isLow: row.is_low ?? false,
  };
}

export type ItemFilter = { q?: string; category?: string; show?: "low" | "old" | "out" | "archived" };

export async function listItems(filter: ItemFilter = {}): Promise<ItemStock[]> {
  const supabase = await createClient();
  let query = supabase.from("item_stock").select(ITEM_COLUMNS).order("name");

  query = query.eq("is_archived", filter.show === "archived");
  if (filter.category) query = query.eq("category_id", filter.category);
  if (filter.show === "low") query = query.eq("is_low", true);
  if (filter.show === "old") query = query.gt("old_quantity", 0);
  if (filter.show === "out") query = query.eq("on_hand", 0);

  // Characters that mean something in a filter expression are dropped from the search text.
  const q = filter.q?.replace(/[%_,()*\\"]/g, " ").trim();
  if (q) query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) throw new Error(`Could not load items: ${error.message}`);
  return data.map(toItem);
}

export async function getItem(id: string): Promise<ItemStock | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("item_stock").select(ITEM_COLUMNS).eq("id", id).maybeSingle();
  if (error) {
    // A malformed id in the address bar is the same as an item that does not exist.
    if (error.code === "22P02") return null;
    throw new Error(`Could not load the item: ${error.message}`);
  }
  return data ? toItem(data) : null;
}

export type Batch = {
  id: string;
  itemId: string;
  itemName: string;
  unit: string;
  receivedOn: string;
  quantityReceived: number;
  quantityRemaining: number;
  unitCost: number | null;
  supplier: string | null;
  note: string | null;
  ageDays: number;
  ageBand: "new" | "aging" | "old";
  remainingValue: number;
};

const BATCH_COLUMNS =
  "id, item_id, item_name, unit, received_on, quantity_received, quantity_remaining, unit_cost, supplier, note, age_days, age_band, remaining_value";

/** Batches that still have stock, oldest first. Narrow to one item, or to archived-free shop-wide lists. */
export async function listOpenBatches(options: { itemId?: string; bands?: Batch["ageBand"][]; limit?: number } = {}): Promise<Batch[]> {
  const supabase = await createClient();
  let query = supabase
    .from("batch_ages")
    .select(BATCH_COLUMNS)
    .order("received_on")
    .order("created_at");
  if (options.itemId) query = query.eq("item_id", options.itemId);
  else query = query.eq("is_archived", false);
  if (options.bands) query = query.in("age_band", options.bands);
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Could not load stock batches: ${error.message}`);
  return data.map((row) => ({
    id: row.id ?? "",
    itemId: row.item_id ?? "",
    itemName: row.item_name ?? "",
    unit: row.unit ?? "pc",
    receivedOn: row.received_on ?? "",
    quantityReceived: row.quantity_received ?? 0,
    quantityRemaining: row.quantity_remaining ?? 0,
    unitCost: row.unit_cost,
    supplier: row.supplier,
    note: row.note,
    ageDays: row.age_days ?? 0,
    ageBand: row.age_band === "old" || row.age_band === "aging" ? row.age_band : "new",
    remainingValue: Number(row.remaining_value ?? 0),
  }));
}

export type Movement = {
  id: string;
  itemId: string;
  itemName: string;
  unit: string;
  direction: "in" | "out";
  reason: string;
  quantity: number;
  occurredOn: string;
  note: string | null;
  by: string | null;
  batchReceivedOn: string | null;
};

export const HISTORY_PAGE_SIZE = 50;

export async function listMovements(
  options: { itemId?: string; direction?: "in" | "out"; reason?: string; limit?: number; page?: number } = {},
): Promise<{ rows: Movement[]; hasMore: boolean }> {
  const supabase = await createClient();
  const limit = options.limit ?? HISTORY_PAGE_SIZE;
  const from = ((options.page ?? 1) - 1) * limit;

  let query = supabase
    .from("stock_movements")
    .select(
      "id, item_id, direction, reason, quantity, occurred_on, note, items(name, unit), profiles(full_name), stock_batches(received_on)",
    )
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    // One extra row tells us whether there is a next page.
    .range(from, from + limit);
  if (options.itemId) query = query.eq("item_id", options.itemId);
  if (options.direction) query = query.eq("direction", options.direction);
  if (options.reason) query = query.eq("reason", options.reason);

  const { data, error } = await query;
  if (error) throw new Error(`Could not load the stock history: ${error.message}`);
  const rows = data.slice(0, limit).map((row) => ({
    id: row.id,
    itemId: row.item_id,
    itemName: row.items?.name ?? "",
    unit: row.items?.unit ?? "pc",
    direction: row.direction === "in" ? ("in" as const) : ("out" as const),
    reason: row.reason,
    quantity: row.quantity,
    occurredOn: row.occurred_on,
    note: row.note,
    by: row.profiles?.full_name ?? null,
    batchReceivedOn: row.stock_batches?.received_on ?? null,
  }));
  return { rows, hasMore: data.length > limit };
}

/** The short list the stock forms search through. */
export async function listItemOptions() {
  const items = await listItems();
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    sku: item.sku,
    unit: item.unit,
    onHand: item.onHand,
    oldestReceivedOn: item.oldestReceivedOn,
  }));
}
export type ItemOption = Awaited<ReturnType<typeof listItemOptions>>[number];
