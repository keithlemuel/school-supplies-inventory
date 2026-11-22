"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { fromDbError, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";

const text = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

/** One line as the order form sends it. Everything is re-checked here against the database. */
type SubmittedLine = {
  description?: unknown;
  itemId?: unknown;
  unitId?: unknown;
  unit?: unknown;
  quantity?: unknown;
  price?: unknown;
};

const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");

/**
 * Saves an order: writes the delivery receipt and takes its inventory items
 * out of stock in one step. Lines that are not inventory items are only
 * written on the receipt.
 */
export async function createOrder(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const customerName = text(formData, "customerName");
  const deliveredOn = text(formData, "deliveredOn");
  const errors: Record<string, string> = {};
  if (!customerName) errors.customerName = "Enter who the order is for.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deliveredOn)) errors.deliveredOn = "Pick a date.";

  let submitted: SubmittedLine[] = [];
  try {
    const parsed: unknown = JSON.parse(text(formData, "lines") || "[]");
    if (Array.isArray(parsed)) submitted = parsed as SubmittedLine[];
  } catch {
    // Treated as an empty order below.
  }
  // Rows left completely blank are ignored.
  submitted = submitted.filter((line) => str(line.description) || str(line.quantity) || str(line.price));
  if (submitted.length === 0) errors.lines = "Add at least one item.";
  if (Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors, message: "Check the highlighted fields." };

  const supabase = await createClient();

  // Units and multipliers come from the database, never from the browser.
  const itemIds = [...new Set(submitted.map((line) => str(line.itemId)).filter(Boolean))];
  const [{ data: items }, { data: units }] = await Promise.all([
    supabase.from("items").select("id, name, unit").in("id", itemIds.length ? itemIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase.from("item_units").select("id, item_id, name, contains").in("item_id", itemIds.length ? itemIds : ["00000000-0000-0000-0000-000000000000"]),
  ]);

  const lines = [];
  for (const [index, line] of submitted.entries()) {
    const where = `Line ${index + 1}`;
    const description = str(line.description);
    const quantityText = str(line.quantity);
    const priceText = str(line.price);
    if (!description) return lineError(`${where}: enter what the item is.`);
    if (description.length > 120) return lineError(`${where}: keep the description under 120 characters.`);
    if (!/^\d+(\.\d{1,2})?$/.test(priceText)) return lineError(`${where}: enter the unit price, like 35 or 35.50.`);

    const item = items?.find((candidate) => candidate.id === str(line.itemId));
    if (item) {
      if (!/^\d+$/.test(quantityText) || Number(quantityText) < 1) {
        return lineError(`${where}: enter a whole number for the quantity of ${item.name}.`);
      }
      const unitId = str(line.unitId);
      const unit = unitId ? units?.find((candidate) => candidate.id === unitId && candidate.item_id === item.id) : null;
      if (unitId && !unit) return lineError(`${where}: that unit was changed or removed. Reload the page and try again.`);
      lines.push({
        item_id: item.id,
        description,
        unit: unit?.name ?? item.unit,
        quantity: Number(quantityText),
        unit_price: Number(priceText),
        stock_quantity: Number(quantityText) * (unit?.contains ?? 1),
      });
    } else {
      if (!/^\d+(\.\d{1,2})?$/.test(quantityText) || Number(quantityText) <= 0) {
        return lineError(`${where}: enter the quantity, like 2 or 0.5.`);
      }
      const unit = str(line.unit);
      if (!unit) return lineError(`${where}: enter the unit, such as pc, set or kilo.`);
      lines.push({
        item_id: null,
        description,
        unit,
        quantity: Number(quantityText),
        unit_price: Number(priceText),
        stock_quantity: null,
      });
    }
  }

  const { data: id, error } = await supabase.rpc("create_delivery_receipt", {
    p_customer_name: customerName,
    p_customer_address: text(formData, "customerAddress"),
    p_delivered_on: deliveredOn,
    p_number: text(formData, "number"),
    p_lines: lines,
  });
  if (error) return fromDbError(error);

  revalidatePath("/", "layout");
  redirect(`/orders/${id}`);
}

function lineError(message: string): ActionResult {
  return { ok: false, message: "Check the items on the order.", fieldErrors: { lines: message } };
}

/** Marks an order paid (today) or back to unpaid. */
export async function setOrderPaid(id: string, paid: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_delivery_receipt_paid", { p_receipt_id: id, p_paid: paid });
  if (error) throw new Error(`Could not update the order: ${error.message}`);
  revalidatePath("/orders", "layout");
}
