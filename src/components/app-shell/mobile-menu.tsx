"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * The phone header's menu. A plain <details>, so it opens without scripts; this
 * closes it again when a page in it is picked, on a tap outside, or on Escape.
 * (The layout stays on screen between pages, so it would otherwise stay open.)
 */
export function MobileMenu({ button, children }: { button: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const close = () => ref.current?.removeAttribute("open");
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current?.open && !ref.current.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && ref.current?.open) {
        close();
        ref.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <details ref={ref} className="relative">
      <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-md outline-none hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-white/60 [&::-webkit-details-marker]:hidden">
        {button}
      </summary>
      <div
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) ref.current?.removeAttribute("open");
        }}
        className="absolute top-12 right-0 w-52 rounded-md border bg-white p-1.5 text-foreground shadow-lg"
      >
        {children}
      </div>
    </details>
  );
}
