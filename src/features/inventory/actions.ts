"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { fromDbError, type ActionResult } from "@/lib/action-result";
import { count, qty } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { IN_REASONS, OUT_REASONS } from "./reasons";

const text = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

function fieldErrors(error: z.ZodError): ActionResult {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    errors[String(issue.path[0])] ??= issue.message;
  }
  return { ok: false, fieldErrors: errors, message: "Check the highlighted fields." };
}

const wholeNumber = (message: string) =>
  z
    .string()
    .regex(/^\d+$/, message)
    .transform(Number);

const optionalMoney = z
  .string()
  .regex(/^(\d+(\.\d{1,2})?)?$/, "Enter an amount like 12 or 12.50.")
  .transform((value) => (value === "" ? null : Number(value)));

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

const itemSchema = z.object({
  name: z.string().min(1, "Enter the item name.").max(120, "Keep the name under 120 characters."),
  sku: z.string().max(40, "Keep the code under 40 characters."),
  categoryId: z.string(),
  unit: z.string().min(1, "Enter how the item is counted, such as pc or box.").max(20, "Keep the unit short."),
  sellingPrice: optionalMoney,
  reorderLevel: wholeNumber("Enter a whole number, or 0 to turn the warning off."),
  notes: z.string().max(500, "Keep the notes under 500 characters."),
});

type UnitInput = { name: string; contains: number; price: number | null };

/** Reads the "bigger units" rows of the item form. Rows left completely empty are ignored. */
function parseUnits(formData: FormData, baseUnit: string): UnitInput[] | string {
  const names = formData.getAll("unitName").map((value) => String(value).trim());
  const holds = formData.getAll("unitContains").map((value) => String(value).trim());
  const prices = formData.getAll("unitPrice").map((value) => String(value).trim());

  const units: UnitInput[] = [];
  for (let index = 0; index < names.length; index++) {
    const [name, contains, price] = [names[index], holds[index] ?? "", prices[index] ?? ""];
    if (!name && !contains && !price) continue;
    if (!name) return "Name each bigger unit, such as box or ream.";
    if (name.length > 20) return "Keep unit names short.";
    if (name.toLowerCase() === baseUnit.toLowerCase()) return `"${name}" is already the smallest unit.`;
    if (units.some((unit) => unit.name.toLowerCase() === name.toLowerCase())) return `"${name}" is listed twice.`;
    if (!/^\d+$/.test(contains) || Number(contains) < 2) {
      return `Say how many ${baseUnit} one ${name} holds. It has to be 2 or more.`;
    }
    if (!/^(\d+(\.\d{1,2})?)?$/.test(price)) return `Enter the ${name} price like 275 or 275.50.`;
    units.push({ name, contains: Number(contains), price: price === "" ? null : Number(price) });
  }
  return units;
}

export async function saveItem(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const id = text(formData, "id");
  const parsed = itemSchema.safeParse({
    name: text(formData, "name"),
    sku: text(formData, "sku"),
    categoryId: text(formData, "categoryId"),
    unit: text(formData, "unit"),
    sellingPrice: text(formData, "sellingPrice"),
    reorderLevel: text(formData, "reorderLevel") || "0",
    notes: text(formData, "notes"),
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  const units = parseUnits(formData, parsed.data.unit);
  if (typeof units === "string") {
    return { ok: false, message: "Check the highlighted fields.", fieldErrors: { units } };
  }

  const values = {
    name: parsed.data.name,
    sku: parsed.data.sku || null,
    category_id: parsed.data.categoryId || null,
    unit: parsed.data.unit,
    selling_price: parsed.data.sellingPrice,
    reorder_level: parsed.data.reorderLevel,
    notes: parsed.data.notes || null,
  };

  const supabase = await createClient();
  let itemId = id;
  if (id) {
    const { error } = await supabase
      .from("items")
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return itemError(error);
  } else {
    const { data, error } = await supabase.from("items").insert(values).select("id").single();
    if (error) return itemError(error);
    itemId = data.id;
  }

  const { error: unitsError } = await supabase.rpc("set_item_units", { p_item_id: itemId, p_units: units });
  if (unitsError) {
    console.error("[db]", unitsError.code, unitsError.message);
    revalidatePath("/", "layout");
    return { ok: false, message: "The item was saved, but its bigger units were not. Open the item and try again." };
  }

  revalidatePath("/", "layout");
  redirect(`/items/${itemId}`);
}

function itemError(error: Parameters<typeof fromDbError>[0]): ActionResult {
  if (error.code === "23505") {
    const field = error.message.includes("sku") ? "sku" : "name";
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: { [field]: field === "sku" ? "Another item already uses this code." : "An item with this name already exists." },
    };
  }
  return fromDbError(error);
}

/** Changes one price from the price list. An empty price clears it. */
export async function setPrice(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = optionalMoney.safeParse(text(formData, "price"));
  if (!parsed.success) return { ok: false, message: "Enter an amount like 12 or 12.50." };

  const supabase = await createClient();
  const id = text(formData, "id");
  // The price list edits both the smallest-unit price (on the item) and the bigger-unit prices.
  const { error } =
    text(formData, "kind") === "unit"
      ? await supabase.from("item_units").update({ selling_price: parsed.data }).eq("id", id)
      : await supabase
          .from("items")
          .update({ selling_price: parsed.data, updated_at: new Date().toISOString() })
          .eq("id", id);
  if (error) return fromDbError(error);

  revalidatePath("/", "layout");
  return { ok: true, stamp: Date.now() };
}

export async function setItemArchived(id: string, archived: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("items")
    .update({ is_archived: archived, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`Could not update the item: ${error.message}`);
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Stock in
// ---------------------------------------------------------------------------

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date.");

const stockInSchema = z.object({
  itemId: z.string().min(1, "Pick an item."),
  quantity: wholeNumber("Enter a whole number above zero.").refine((n) => n > 0, "Enter a whole number above zero."),
  receivedOn: isoDate,
  unitCost: optionalMoney,
  supplier: z.string().max(120, "Keep the supplier name under 120 characters."),
  note: z.string().max(300, "Keep the note under 300 characters."),
  reason: z.enum(Object.keys(IN_REASONS) as [keyof typeof IN_REASONS, ...(keyof typeof IN_REASONS)[]]),
});

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * The bigger unit a quantity was entered in, looked up on the server so the
 * multiplier never comes from the browser. Null means the smallest unit.
 */
async function pickedUnit(
  supabase: Supabase,
  itemId: string,
  unitId: string,
): Promise<{ unit: { name: string; contains: number } | null; error?: string }> {
  if (!unitId) return { unit: null };
  const { data } = await supabase
    .from("item_units")
    .select("name, contains")
    .eq("id", unitId)
    .eq("item_id", itemId)
    .maybeSingle();
  return data ? { unit: data } : { unit: null, error: "That unit was changed or removed. Reload the page and try again." };
}

/** "2 box (100 pc)" when entered in a bigger unit, otherwise just "100 pc". */
function entered(quantity: number, unit: { name: string; contains: number } | null, baseUnit: string | null | undefined) {
  if (!unit) return qty(quantity, baseUnit);
  return `${count(quantity)} ${unit.name} (${qty(quantity * unit.contains, baseUnit)})`;
}

export async function stockIn(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = stockInSchema.safeParse({
    itemId: text(formData, "itemId"),
    quantity: text(formData, "quantity"),
    receivedOn: text(formData, "receivedOn"),
    unitCost: text(formData, "unitCost"),
    supplier: text(formData, "supplier"),
    note: text(formData, "note"),
    reason: text(formData, "reason") || "delivery",
  });
  if (!parsed.success) return fieldErrors(parsed.error);
  const input = parsed.data;

  const supabase = await createClient();
  const picked = await pickedUnit(supabase, input.itemId, text(formData, "unitId"));
  if (picked.error) return { ok: false, message: picked.error };
  const per = picked.unit?.contains ?? 1;
  const baseQuantity = input.quantity * per;

  const { error } = await supabase.rpc("receive_stock", {
    p_item_id: input.itemId,
    p_quantity: baseQuantity,
    p_received_on: input.receivedOn,
    // The cost was typed for the unit received; stock keeps it per smallest unit.
    p_unit_cost: input.unitCost == null ? undefined : Math.round((input.unitCost / per) * 100) / 100,
    p_supplier: input.supplier || undefined,
    p_note: input.note || undefined,
    p_reason: input.reason,
  });
  if (error) return fromDbError(error);

  const { data: item } = await supabase
    .from("item_stock")
    .select("name, unit, on_hand")
    .eq("id", input.itemId)
    .maybeSingle();
  // Say how the shelf is now split, so the older stock is not lost in the new total.
  const earlier = (item?.on_hand ?? baseQuantity) - baseQuantity;
  const added = `Added ${entered(input.quantity, picked.unit, item?.unit)} of ${item?.name ?? "the item"}.`;
  revalidatePath("/", "layout");
  return {
    ok: true,
    message:
      earlier > 0
        ? `${added} On the shelf now: ${qty(earlier, item?.unit)} from earlier deliveries and ${qty(baseQuantity, item?.unit)} from this one.`
        : added,
    stamp: Date.now(),
    // A delivery usually has several items, so the date and supplier stay filled in.
    keep: { receivedOn: input.receivedOn, supplier: input.supplier, reason: input.reason },
  };
}

// ---------------------------------------------------------------------------
// Stock out
// ---------------------------------------------------------------------------

const stockOutSchema = z.object({
  itemId: z.string().min(1, "Pick an item."),
  batchId: z.string(),
  quantity: wholeNumber("Enter a whole number above zero.").refine((n) => n > 0, "Enter a whole number above zero."),
  occurredOn: isoDate,
  reason: z.enum(Object.keys(OUT_REASONS) as [keyof typeof OUT_REASONS, ...(keyof typeof OUT_REASONS)[]], {
    message: "Pick a reason.",
  }),
  note: z.string().max(300, "Keep the note under 300 characters."),
});

export async function stockOut(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = stockOutSchema.safeParse({
    itemId: text(formData, "itemId"),
    batchId: text(formData, "batchId"),
    quantity: text(formData, "quantity"),
    occurredOn: text(formData, "occurredOn"),
    reason: text(formData, "reason"),
    note: text(formData, "note"),
  });
  if (!parsed.success) return fieldErrors(parsed.error);
  const input = parsed.data;

  const supabase = await createClient();
  const picked = await pickedUnit(supabase, input.itemId, text(formData, "unitId"));
  if (picked.error) return { ok: false, message: picked.error };

  const { error } = await supabase.rpc("remove_stock", {
    p_item_id: input.itemId,
    p_quantity: input.quantity * (picked.unit?.contains ?? 1),
    p_reason: input.reason,
    p_occurred_on: input.occurredOn,
    p_note: input.note || undefined,
    p_batch_id: input.batchId || undefined,
  });
  if (error) return fromDbError(error);

  const { data: item } = await supabase.from("items").select("name, unit").eq("id", input.itemId).maybeSingle();
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: `Took out ${entered(input.quantity, picked.unit, item?.unit)} of ${item?.name ?? "the item"}.`,
    stamp: Date.now(),
    keep: { occurredOn: input.occurredOn, reason: input.reason },
  };
}
