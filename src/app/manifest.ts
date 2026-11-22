import type { MetadataRoute } from "next";

import { SHOP_NAME } from "@/lib/shop";

/** Lets a phone add the inventory to its home screen with the store's name, icon and colours. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SHOP_NAME} Inventory`,
    short_name: "Rhum's",
    description: `Inventory for ${SHOP_NAME}.`,
    start_url: "/",
    display: "standalone",
    background_color: "#f2f5f3",
    theme_color: "#1e4638",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
