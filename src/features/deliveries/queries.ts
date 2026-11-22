import "server-only";

import { createClient } from "@/lib/supabase/server";

export type Customer = { id: string; name: string; address: string | null };

export async function listCustomers(): Promise<Customer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("customers").select("id, name, address").order("name");
  if (error) throw new Error(`Could not load customers: ${error.message}`);
  return data;
}

export type ReceiptSummary = {
  id: string;
  number: string;
  customerName: string;
  deliveredOn: string;
  total: number;
  lineCount: number;
  /** The day it was marked paid; null while the customer still owes it. */
  paidOn: string | null;
};

export type PaymentFilter = "paid" | "unpaid";

export async function listDeliveryReceipts({ payment }: { payment?: PaymentFilter } = {}): Promise<ReceiptSummary[]> {
  const supabase = await createClient();
  let query = supabase
    .from("delivery_receipts")
    .select("id, number, customer_name, delivered_on, total, paid_on, delivery_receipt_lines(count)");
  if (payment === "paid") query = query.not("paid_on", "is", null);
  if (payment === "unpaid") query = query.is("paid_on", null);
  const { data, error } = await query
    .order("delivered_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(`Could not load delivery receipts: ${error.message}`);
  return data.map((row) => ({
    id: row.id,
    number: row.number,
    customerName: row.customer_name,
    deliveredOn: row.delivered_on,
    total: Number(row.total),
    lineCount: row.delivery_receipt_lines[0]?.count ?? 0,
    paidOn: row.paid_on,
  }));
}

/** How many orders are still unpaid, and how much is owed on them in all. */
export async function getUnpaidSummary(): Promise<{ count: number; total: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("delivery_receipts").select("total").is("paid_on", null);
  if (error) throw new Error(`Could not load unpaid orders: ${error.message}`);
  return { count: data.length, total: data.reduce((sum, row) => sum + Number(row.total), 0) };
}

export type ReceiptLine = {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  /** True when the line took stock off the shelf. */
  fromStock: boolean;
};

export type Receipt = {
  id: string;
  number: string;
  customerName: string;
  customerAddress: string | null;
  deliveredOn: string;
  total: number;
  by: string | null;
  paidOn: string | null;
  /** Who marked it paid. */
  paidBy: string | null;
  lines: ReceiptLine[];
};

export async function getDeliveryReceipt(id: string): Promise<Receipt | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("delivery_receipts")
    .select(
      // Two links to profiles (who made it, who marked it paid), so each is named.
      "id, number, customer_name, customer_address, delivered_on, total, paid_on, creator:profiles!delivery_receipts_created_by_fkey(full_name), payer:profiles!delivery_receipts_paid_by_fkey(full_name), delivery_receipt_lines(id, position, description, unit, quantity, unit_price, stock_quantity)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) {
    // A malformed id in the address bar is the same as a receipt that does not exist.
    if (error.code === "22P02") return null;
    throw new Error(`Could not load the delivery receipt: ${error.message}`);
  }
  if (!data) return null;

  return {
    id: data.id,
    number: data.number,
    customerName: data.customer_name,
    customerAddress: data.customer_address,
    deliveredOn: data.delivered_on,
    total: Number(data.total),
    by: data.creator?.full_name ?? null,
    paidOn: data.paid_on,
    paidBy: data.payer?.full_name ?? null,
    lines: [...data.delivery_receipt_lines]
      .sort((a, b) => a.position - b.position)
      .map((line) => ({
        id: line.id,
        description: line.description,
        unit: line.unit,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unit_price),
        fromStock: line.stock_quantity != null,
      })),
  };
}
