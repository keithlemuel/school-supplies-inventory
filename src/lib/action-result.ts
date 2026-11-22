import type { PostgrestError } from "@supabase/supabase-js";

export type ActionResult = {
  ok: boolean;
  /** Shown to the user. */
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Changes on every success, so a form can clear itself for the next entry. */
  stamp?: number;
  /** Values worth keeping for the next entry (the delivery date, the supplier). */
  keep?: Record<string, string>;
};

export const idle: ActionResult = { ok: false };

/**
 * Turns a database error into something the user can act on. The stock rules
 * raise plain-language messages (code P0001); anything else is unexpected.
 */
export function fromDbError(error: PostgrestError, fallback = "That did not save. Try again."): ActionResult {
  if (error.code === "P0001") {
    return { ok: false, message: error.message };
  }
  if (error.code === "23505") {
    return { ok: false, message: "That name is already in use." };
  }
  console.error("[db]", error.code, error.message, error.details);
  return { ok: false, message: fallback };
}
