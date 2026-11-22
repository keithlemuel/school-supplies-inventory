import type { Metadata } from "next";

import { SHOP_NAME } from "@/lib/shop";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh grid-rows-[auto_1fr] lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:grid-rows-1">
      <section className="flex flex-col justify-between gap-10 bg-board px-6 py-8 text-white lg:px-14 lg:py-14">
        <p className="font-heading text-xl leading-tight font-bold">
          {SHOP_NAME}
          <span className="block font-sans text-sm font-normal text-white/65">Inventory</span>
        </p>
        <div className="max-w-md">
          <h1 className="text-3xl leading-[1.1] font-bold tracking-tight lg:text-5xl">
            Know what is on the shelf, and how long it has been there.
          </h1>
          <p className="mt-5 hidden text-lg leading-relaxed text-white/75 lg:block">
            Every delivery keeps its date, so the oldest notebooks, pens and paper are the first ones you sell or
            clear out.
          </p>
          {/* A ruler, the same one that measures how old each delivery is inside the app. */}
          <div aria-hidden className="mt-8 hidden h-3 max-w-sm overflow-hidden rounded-[3px] bg-white/12 lg:block">
            <div className="flex h-full">
              <div className="w-[25%] bg-[#58b88a]" />
              <div className="w-[25%] bg-pencil" />
              <div className="w-[30%] bg-[#e0685e]" />
            </div>
          </div>
        </div>
        <p className="hidden text-sm text-white/55 lg:block">For store staff only.</p>
      </section>

      <section className="flex items-start justify-center px-6 py-10 lg:items-center">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
          <p className="mt-1 text-muted-foreground">Use the account that was set up for you.</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
