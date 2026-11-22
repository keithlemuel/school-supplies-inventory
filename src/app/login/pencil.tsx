import { SHOP_NAME } from "@/lib/shop";

/**
 * A yellow No. 2 pencil with the store's name stamped on it, the way a brand
 * is stamped on a real one. Drawn flat, side on: eraser, brass ferrule, three
 * visible faces of the hexagonal body, then the sharpened wood and the lead.
 */
export function Pencil({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1000 70" aria-hidden className={className}>
      {/* Eraser */}
      <path d="M14 4H62V66H14Q2 66 2 54V16Q2 4 14 4Z" fill="#e58b8b" />
      <path d="M14 4H62V19H2V16Q2 4 14 4Z" fill="#f0a9a9" />
      <path d="M2 51H62V66H14Q2 66 2 54Z" fill="#cf7474" />

      {/* Ferrule: brass with a green band and crimp lines */}
      <rect x="62" y="2" width="70" height="66" fill="#cdb872" />
      <rect x="62" y="2" width="70" height="16" fill="#e6d79c" />
      <rect x="62" y="52" width="70" height="16" fill="#a8934d" />
      <rect x="85" y="2" width="24" height="66" fill="#1e4638" />
      <rect x="85" y="2" width="24" height="16" fill="#2d6350" />
      <rect x="85" y="52" width="24" height="16" fill="#143026" />
      <g stroke="#8f7c3e" strokeWidth="2">
        <path d="M71 2V68M77 2V68M117 2V68M123 2V68" />
      </g>

      {/* Sharpened wood, then the lead */}
      <path d="M872 5L986 35L872 65Z" fill="#ecd0a5" />
      <path d="M872 35H986L872 65Z" fill="#ddbd8d" />
      <path d="M952 26.05L986 35L952 43.95Z" fill="#33373a" />

      {/* Body: the three faces you see from the side, each ending in the scallop a sharpener leaves */}
      <path d="M132 5H872Q886 13 872 21H132Z" fill="#f8d15c" />
      <path d="M132 21H872Q902 35 872 49H132Z" fill="#f4bf2d" />
      <path d="M132 49H872Q886 57 872 65H132Z" fill="#dba312" />

      {/* The stamp */}
      <g fill="#143026" fontFamily="var(--font-display)" fontWeight="700">
        <text x="168" y="44" fontSize="25" letterSpacing="2.5">
          {SHOP_NAME.toUpperCase()}
        </text>
        <path d="M604 35l6-6 6 6-6 6Z" />
        <text x="630" y="41" fontSize="15" letterSpacing="3">
          INVENTORY
        </text>
        <rect x="778" y="24" width="44" height="22" rx="11" fill="none" stroke="#143026" strokeWidth="2" />
        <text x="800" y="40.5" fontSize="14" textAnchor="middle">
          No.2
        </text>
      </g>
    </svg>
  );
}
