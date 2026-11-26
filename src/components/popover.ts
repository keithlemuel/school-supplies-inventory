"use client";

import { useEffect, type RefObject } from "react";

/** Room kept clear at the bottom of the screen for the phone tab bar, and at the top for the phone header. */
const BOTTOM_BAR = 88;
const TOP_BAR = 64;

/**
 * Opens a panel below its trigger, or above it when it would run under the
 * bottom of the screen and fits whole overhead (below the phone header). When
 * it fits neither way it opens below and `useRevealPanel` scrolls it into view.
 * Also lines the panel up with the trigger's right edge when it would spill
 * off the right side.
 */
export function placePanel(trigger: HTMLElement, panelHeight: number, panelWidth = 0) {
  const rect = trigger.getBoundingClientRect();
  const below = window.innerHeight - rect.bottom - BOTTOM_BAR;
  const above = rect.top - TOP_BAR;
  return {
    side: below < panelHeight && above >= panelHeight ? ("above" as const) : ("below" as const),
    align: rect.left + panelWidth > window.innerWidth - 16 ? ("end" as const) : ("start" as const),
  };
}

export type Placement = ReturnType<typeof placePanel>;

/** Closes an open panel when someone presses outside it, or tabs out of it. */
export function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };
    const onFocusIn = (event: FocusEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [ref, open, onClose]);
}

/** Scrolls a just-opened panel fully into view when it opened past the bottom of the screen. */
export function useRevealPanel(ref: RefObject<HTMLElement | null>, open: boolean) {
  useEffect(() => {
    if (!open || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const overflow = rect.bottom - (window.innerHeight - BOTTOM_BAR);
    if (overflow > 0) window.scrollBy({ top: overflow + 8, behavior: "smooth" });
  }, [ref, open]);
}
