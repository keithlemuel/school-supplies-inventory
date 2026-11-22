import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** The icon a phone shows when the inventory is added to the home screen: the mark on chalkboard green. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1e4638" }}>
        <svg width="132" height="132" viewBox="0 0 48 48">
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
      </div>
    ),
    size,
  );
}
