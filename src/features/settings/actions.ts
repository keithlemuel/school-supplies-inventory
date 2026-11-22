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

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({ name });
  if (error) {
    if (error.code === "23505") return { ok: false, fieldErrors: { name: "That category already exists." } };
    return fromDbError(error);
  }
  revalidatePath("/", "layout");
  return { ok: true, stamp: Date.now() };
}

/** Items in a deleted category stay; they just have no category until one is picked. */
export async function deleteCategory(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(`Could not delete the category: ${error.message}`);
  revalidatePath("/", "layout");
}
