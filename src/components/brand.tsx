import { cn } from "cn";

import { SHOP_NAME } from "@/lib/shop";

/**
 * The store's mark: a pencil seen end-on (a yellow hexagon with its painted
 * edge) carrying the R of Rhum's. The same drawing is the browser tab icon
 * (src/app/icon.svg) and the phone home-screen icon (src/app/apple-icon.tsx).
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={cn("shrink-0", className)}>
      <path d="M45 24 34.5 42.2h-21L3 24 13.5 5.8h21Z" fill="#f4bf2d" stroke="#f4bf2d" strokeWidth="4" strokeLinejoin="round" />
      <path d="M40.4 24 32.2 38.2H15.8L7.6 24l8.2-14.2h16.4Z" fill="none" stroke="#dba312" strokeWidth="1.5" strokeLinejoin="round" />
      <path
        d="M18.5 34V14h7.25a6 6 0 0 1 0 12H18.5m7 0 6 8"
        fill="none"
        stroke="#143026"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The mark with the store's name beside it. `detail` is the small second line. */
export function Brand({
  detail,
  className,
  markClassName = "size-10",
  detailClassName = "text-white/65",
}: {
  detail?: string;
  className?: string;
  markClassName?: string;
  detailClassName?: string;
}) {
  return (
    <span className={cn("flex min-w-0 items-center gap-3", className)}>
      <BrandMark className={markClassName} />
      <span className="min-w-0 leading-tight">
        <span className="block font-heading text-[1.05rem] leading-[1.15] font-bold">{SHOP_NAME}</span>
        {detail ? <span className={cn("mt-0.5 block text-sm", detailClassName)}>{detail}</span> : null}
      </span>
    </span>
  );
}
