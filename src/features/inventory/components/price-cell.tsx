"use client";

import { useState } from "react";

import { TextInput } from "@/components/form";
import { Button } from "@/components/ui/button";
import { useFormAction } from "@/components/use-form-action";
import { money } from "@/lib/format";
import { setPrice } from "../actions";
import type { PriceLine } from "../price-list";

/** A price on the price list that can be changed in place. */
export function PriceCell({ line, label }: { line: PriceLine; label: string }) {
  const { state, pending, onSubmit, action } = useFormAction(setPrice);
  // Editing closes by itself once a save goes through and the stamp moves on.
  const [opened, setOpened] = useState<{ stamp: number | undefined } | null>(null);
  const editing = opened !== null && opened.stamp === state.stamp;

  if (!editing) {
    return (
      <span className="flex items-center justify-end gap-1">
        <span className={`tabular ${line.price == null ? "text-muted-foreground" : "font-semibold"}`}>
          {line.price == null ? "No price" : money(line.price)}
        </span>
        <Button variant="ghost" size="sm" onClick={() => setOpened({ stamp: state.stamp })} className="px-2 text-link">
          {line.price == null ? "Set" : "Change"}
          <span className="sr-only"> price of {label}</span>
        </Button>
      </span>
    );
  }

  return (
    <form action={action} onSubmit={onSubmit} className="flex flex-col items-end gap-1">
      <span className="flex items-center gap-1.5">
        <input type="hidden" name="id" value={line.id} />
        <input type="hidden" name="kind" value={line.kind} />
        <span className="text-muted-foreground">₱</span>
        <TextInput
          name="price"
          defaultValue={line.price ?? ""}
          inputMode="decimal"
          autoComplete="off"
          autoFocus
          aria-label={`Price of ${label}`}
          aria-invalid={Boolean(state.message) || undefined}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpened(null);
          }}
          className="h-9 w-24 text-right"
        />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpened(null)} className="px-2">
          Cancel
        </Button>
      </span>
      {state.message ? <span className="text-sm font-medium text-destructive">{state.message}</span> : null}
    </form>
  );
}
