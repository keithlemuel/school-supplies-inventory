"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { fromDbError, type ActionResult } from "@/lib/action-result";
import { qty } from "@/lib/format";
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
  const { error } = await supabase.rpc("receive_stock", {
    p_item_id: input.itemId,
    p_quantity: input.quantity,
    p_received_on: input.receivedOn,
    p_unit_cost: input.unitCost ?? undefined,
    p_supplier: input.supplier || undefined,
    p_note: input.note || undefined,
    p_reason: input.reason,
  });
  if (error) return fromDbError(error);

  const { data: item } = await supabase.from("items").select("name, unit").eq("id", input.itemId).maybeSingle();
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: `Added ${qty(input.quantity, item?.unit)} of ${item?.name ?? "the item"}.`,
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
  const { error } = await supabase.rpc("remove_stock", {
    p_item_id: input.itemId,
    p_quantity: input.quantity,
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
    message: `Took out ${qty(input.quantity, item?.unit)} of ${item?.name ?? "the item"}.`,
    stamp: Date.now(),
    keep: { occurredOn: input.occurredOn, reason: input.reason },
  };
}
