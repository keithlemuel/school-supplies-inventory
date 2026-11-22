"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { fromDbError, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";

const text = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

const days = (message: string) =>
  z
    .string()
    .regex(/^\d+$/, message)
    .transform(Number)
    .refine((n) => n > 0 && n <= 3650, message);

const settingsSchema = z
  .object({
    agingAfterDays: days("Enter a number of days above zero."),
    oldAfterDays: days("Enter a number of days above zero."),
  })
  .refine((v) => v.oldAfterDays > v.agingAfterDays, {
    path: ["oldAfterDays"],
    message: "Old has to come later than aging.",
  });

export async function saveSettings(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse({
    agingAfterDays: text(formData, "agingAfterDays"),
    oldAfterDays: text(formData, "oldAfterDays"),
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { ok: false, fieldErrors: errors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .update({
      aging_after_days: parsed.data.agingAfterDays,
      old_after_days: parsed.data.oldAfterDays,
    })
    .eq("id", true);
  if (error) return fromDbError(error);

  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved." };
}

export async function addCategory(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const name = text(formData, "name");
  if (!name) return { ok: false, fieldErrors: { name: "Enter a category name." } };
  if (name.length > 40) return { ok: false, fieldErrors: { name: "Keep the name under 40 characters." } };

  const parentId = text(formData, "parentId") || null;

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({ name, parent_id: parentId });
  if (error) {
    if (error.code === "23505") {
      return { ok: false, fieldErrors: { name: parentId ? "That subcategory already exists there." : "That category already exists." } };
    }
    return fromDbError(error);
  }
  revalidatePath("/", "layout");
  return { ok: true, stamp: Date.now() };
}

export async function renameCategory(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const id = text(formData, "id");
  const name = text(formData, "name");
  if (!name) return { ok: false, fieldErrors: { name: "Enter a category name." } };
  if (name.length > 40) return { ok: false, fieldErrors: { name: "Keep the name under 40 characters." } };

  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").update({ name }).eq("id", id).select("id");
  if (error) {
    if (error.code === "23505") return { ok: false, fieldErrors: { name: "Another category already has that name." } };
    return fromDbError(error);
  }
  if (data.length === 0) return { ok: false, message: "That category was deleted. Reload the page." };

  // Items show their category's name, so every list that mentions it is refreshed.
  revalidatePath("/", "layout");
  return { ok: true, stamp: Date.now() };
}

/**
 * Items in a deleted category stay; they just have no category until one is
 * picked. Subcategories of a deleted main category become main categories.
 */
export async function deleteCategory(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", text(formData, "id"));
  if (error) {
    // A subcategory moving up would clash with a main category of the same name.
    if (error.code === "23505") {
      return { ok: false, message: "One of its subcategories has the same name as a main category. Rename or delete that subcategory first." };
    }
    return fromDbError(error);
  }
  revalidatePath("/", "layout");
  return { ok: true, stamp: Date.now() };
}
