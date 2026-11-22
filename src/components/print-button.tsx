"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

/** Opens the browser's print window, where "Save as PDF" turns the page into a file. */
export function PrintButton({ children }: { children: ReactNode }) {
  return <Button onClick={() => window.print()}>{children}</Button>;
}
