import type { Metadata } from "next";

import { Brand } from "@/components/brand";
import { SHOP_NAME } from "@/lib/shop";
import { LoginForm } from "./login-form";
import { Pencil } from "./pencil";

export const metadata: Metadata = { title: "Sign in" };

/*
  The sign-in page is a sheet of ruled pad paper: a blank header, a red margin
  line, and rules every 2.25rem. Everything written on it is a whole number of
  rules tall (the `h-9` / `h-18` rows), so text and the two answer lines of the
  form land on the paper's own rules.
*/
export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-[#fdfdfa] [--paper-margin:2.5rem] sm:[--paper-margin:clamp(5rem,17vw,17rem)]">
      {/* The margin line runs the full height of the sheet, header included. */}
      <div aria-hidden className="absolute inset-y-0 left-(--paper-margin) w-0.5 bg-[#e0685e]/70" />

      <Pencil className="pointer-events-none absolute top-11 -left-24 w-[40rem] max-w-none origin-left -rotate-2 drop-shadow-[0_10px_7px_rgb(20_48_38/0.22)] sm:top-14 sm:-left-12 sm:w-[clamp(46rem,80vw,70rem)]" />

      <div className="h-36 shrink-0 sm:h-54" />

      <div className="paper-rules flex-1 border-t border-[#a9c6e4] pr-5 pl-[calc(var(--paper-margin)+1.25rem)] sm:pl-[calc(var(--paper-margin)+2rem)]">
        <h1 className="flex h-18 items-end pb-1.5 text-[2.75rem] leading-none font-bold tracking-tight">
          Sign in
          <span className="sr-only"> to the {SHOP_NAME} inventory</span>
        </h1>
        <p className="flex h-9 items-end pb-1.5 leading-none text-muted-foreground">
          Use the account that was set up for you.
        </p>
        <LoginForm />
        {/* Signed at the bottom of the sheet with the store's mark. */}
        <div className="flex h-18 items-center">
          <Brand detail="For store staff only." markClassName="size-9" detailClassName="text-muted-foreground" />
        </div>
      </div>
    </main>
  );
}
