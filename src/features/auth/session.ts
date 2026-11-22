import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export type CurrentUser = { id: string; email: string; fullName: string };

/**
 * The signed-in user. Redirects to the login page otherwise.
 * Cached per request, so pages and layouts can all call it freely.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) {
    redirect("/login");
  }

  return { id: profile.id, email: profile.email, fullName: profile.full_name };
});
