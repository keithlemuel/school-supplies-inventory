import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";

import { SHOP_NAME } from "@/lib/shop";
import "./globals.css";

// Bricolage has the slightly hand-cut look of a shop sign; Figtree stays
// clear in long tables of item names and quantities.
const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"] });
const body = Figtree({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: `${SHOP_NAME} Inventory`,
    template: `%s · ${SHOP_NAME}`,
  },
  description: `Inventory for ${SHOP_NAME}: what came in, what went out, and which stock is oldest.`,
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets the bottom tab bar pad itself clear of the phone's home indicator.
  viewportFit: "cover",
  themeColor: "#1e4638",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
