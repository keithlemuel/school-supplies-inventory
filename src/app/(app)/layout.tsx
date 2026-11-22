import Link from "next/link";
import { Suspense } from "react";
import { History, Hourglass, LogOut, Menu, ReceiptText, Settings, Tags } from "lucide-react";

import { MobileMenu } from "@/components/app-shell/mobile-menu";
import { MobileTabs, NavLinks } from "@/components/app-shell/nav-links";
import { signOut } from "@/features/auth/actions";
import { getCurrentUser } from "@/features/auth/session";
import { listOpenBatches } from "@/features/inventory/queries";
import { Brand } from "@/components/brand";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)] print:block print:min-h-0">
      <aside className="hidden bg-board text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:overflow-y-auto lg:px-4 lg:py-6 print:hidden">
        <Link href="/" className="mb-7 block rounded-md px-1 outline-none focus-visible:ring-3 focus-visible:ring-white/60">
          <Brand detail="Inventory" />
        </Link>
        <Suspense fallback={<div className="h-24 rounded-md bg-white/10" />}>
          <Sidebar />
        </Suspense>
        <div className="mt-auto border-t border-white/12 pt-4">
          <Suspense fallback={<div className="h-10" />}>
            <Account />
          </Suspense>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Phone only: a slim bar with the name and the less-used pages. */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-board pr-2 pl-4 text-white lg:hidden print:hidden">
          <Link href="/" className="min-w-0 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-white/60">
            <Brand markClassName="size-8" className="gap-2.5" />
          </Link>
          <MobileMenu
            button={
              <>
                <span className="relative">
                  <Menu className="size-5.5" />
                  <Suspense>
                    <OldStockDot />
                  </Suspense>
                </span>
                <span className="sr-only">More pages</span>
              </>
            }
          >
            <Suspense fallback={<OldStockMenuLink count={0} />}>
              <OldStockMenuItem />
            </Suspense>
            <Link href="/orders" className="flex h-11 items-center gap-3 rounded px-3 font-medium hover:bg-muted">
              <ReceiptText className="size-4.5" /> Orders
            </Link>
            <Link href="/price-list" className="flex h-11 items-center gap-3 rounded px-3 font-medium hover:bg-muted">
              <Tags className="size-4.5" /> Price list
            </Link>
            <Link href="/history" className="flex h-11 items-center gap-3 rounded px-3 font-medium hover:bg-muted">
              <History className="size-4.5" /> History
            </Link>
            <Link href="/settings" className="flex h-11 items-center gap-3 rounded px-3 font-medium hover:bg-muted">
              <Settings className="size-4.5" /> Settings
            </Link>
            <form action={signOut}>
              <button className="flex h-11 w-full items-center gap-3 rounded px-3 font-medium hover:bg-muted">
                <LogOut className="size-4.5" /> Sign out
              </button>
            </form>
          </MobileMenu>
        </header>

        <main className="mx-auto w-full max-w-[76rem] flex-1 px-4 pt-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:px-10 lg:py-9 print:max-w-none print:p-0">
          {children}
        </main>
      </div>

      <Suspense>
        <MobileNav />
      </Suspense>
    </div>
  );
}

async function countOldBatches() {
  await getCurrentUser();
  return (await listOpenBatches({ bands: ["old"] })).length;
}

async function Sidebar() {
  return <NavLinks oldBatches={await countOldBatches()} />;
}

function MobileNav() {
  return <MobileTabs />;
}

/** A red dot on the phone menu button while there is old stock to clear, since Old stock is inside that menu. */
async function OldStockDot() {
  const old = await countOldBatches();
  if (old === 0) return null;
  return (
    <span aria-hidden className="absolute -top-0.5 -right-1 size-2.5 rounded-full bg-[#e0685e] ring-2 ring-board" />
  );
}

async function OldStockMenuItem() {
  return <OldStockMenuLink count={await countOldBatches()} />;
}

function OldStockMenuLink({ count }: { count: number }) {
  return (
    <Link href="/old-stock" className="flex h-11 items-center gap-3 rounded px-3 font-medium hover:bg-muted">
      <Hourglass className="size-4.5" /> Old stock
      {count > 0 ? (
        <span className="tabular ml-auto rounded-full bg-old px-2 py-px text-xs font-bold text-white">
          {count > 99 ? "99+" : count}
          <span className="sr-only"> old {count === 1 ? "delivery" : "deliveries"}</span>
        </span>
      ) : null}
    </Link>
  );
}

async function Account() {
  const user = await getCurrentUser();
  return (
    <div className="flex items-center gap-2 px-1">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{user.fullName}</p>
        <p className="truncate text-xs text-white/60">{user.email}</p>
      </div>
      <form action={signOut}>
        <button
          title="Sign out"
          className="flex size-9 items-center justify-center rounded-md text-white/75 outline-none hover:bg-white/10 hover:text-white focus-visible:ring-3 focus-visible:ring-white/60"
        >
          <LogOut className="size-4.5" />
          <span className="sr-only">Sign out</span>
        </button>
      </form>
    </div>
  );
}
