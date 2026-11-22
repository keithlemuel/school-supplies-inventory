"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  History,
  Hourglass,
  LayoutDashboard,
  PackageMinus,
  PackagePlus,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";

type Item = { href: string; label: string; icon: LucideIcon; badge?: number; match: (path: string) => boolean };

function items(oldBatches: number): Item[] {
  return [
    { href: "/", label: "Overview", icon: LayoutDashboard, match: (p) => p === "/" },
    { href: "/items", label: "Items", icon: ClipboardList, match: (p) => p.startsWith("/items") },
    { href: "/old-stock", label: "Old stock", icon: Hourglass, badge: oldBatches, match: (p) => p.startsWith("/old-stock") },
    { href: "/history", label: "History", icon: History, match: (p) => p.startsWith("/history") },
    { href: "/settings", label: "Settings", icon: Settings, match: (p) => p.startsWith("/settings") },
  ];
}

/** Desktop sidebar: the two everyday actions on top, then the places to look things up. */
export function NavLinks({ oldBatches }: { oldBatches: number }) {
  const pathname = usePathname();
  const focus = "outline-none focus-visible:ring-3 focus-visible:ring-white/60";

  return (
    <nav aria-label="Main" className="flex flex-col gap-6">
      <div className="grid gap-2">
        <Link
          href="/stock-in"
          className={cn("flex h-11 items-center gap-2.5 rounded-md bg-pencil px-4 font-bold text-board-deep transition-colors hover:bg-pencil-deep", focus)}
        >
          <PackagePlus className="size-5" />
          Stock in
        </Link>
        <Link
          href="/stock-out"
          className={cn("flex h-11 items-center gap-2.5 rounded-md border border-white/30 px-4 font-bold text-white transition-colors hover:bg-white/10", focus)}
        >
          <PackageMinus className="size-5" />
          Stock out
        </Link>
      </div>

      <ul className="flex flex-col gap-1">
        {items(oldBatches).map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-[0.95rem] font-medium transition-colors",
                  focus,
                  active ? "bg-white/14 text-white" : "text-white/72 hover:bg-white/8 hover:text-white",
                )}
              >
                <item.icon className="size-4.5 shrink-0" />
                {item.label}
                {item.badge ? (
                  <span className="tabular ml-auto rounded-full bg-[#e0685e] px-2 py-px text-xs font-bold text-white">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Phone navigation: a tab bar within thumb reach, with stock in and out in the middle. */
export function MobileTabs({ oldBatches }: { oldBatches: number }) {
  const pathname = usePathname();
  const tabs: Item[] = [
    { href: "/", label: "Overview", icon: LayoutDashboard, match: (p) => p === "/" },
    { href: "/items", label: "Items", icon: ClipboardList, match: (p) => p.startsWith("/items") },
    { href: "/stock-in", label: "Stock in", icon: PackagePlus, match: (p) => p.startsWith("/stock-in") },
    { href: "/stock-out", label: "Stock out", icon: PackageMinus, match: (p) => p.startsWith("/stock-out") },
    { href: "/old-stock", label: "Old stock", icon: Hourglass, badge: oldBatches, match: (p) => p.startsWith("/old-stock") },
  ];

  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-semibold outline-none transition-colors focus-visible:bg-muted",
                  active ? "text-board" : "text-muted-foreground",
                )}
              >
                {active ? <span aria-hidden className="absolute inset-x-5 top-0 h-0.5 rounded-b bg-board" /> : null}
                <span className="relative">
                  <tab.icon className="size-5.5" />
                  {tab.badge ? (
                    <span className="tabular absolute -top-1.5 left-3.5 flex min-w-4.5 items-center justify-center rounded-full bg-old px-1 text-[0.6875rem] leading-[1.125rem] font-bold text-white">
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </span>
                  ) : null}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
