"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "cn";

import { controlClass } from "@/components/control-class";
import { Button } from "@/components/ui/button";
import { qty } from "@/lib/format";
import type { ItemOption } from "../queries";

/**
 * Type-to-find item chooser. The shop has more items than fit a dropdown, and
 * people know them by name, so this filters as they type.
 */
export function ItemPicker({
  items,
  value,
  onChange,
  invalid,
}: {
  items: ItemOption[];
  value: string;
  onChange: (id: string) => void;
  invalid?: boolean;
}) {
  const [query, setQuery] = useState("");
  const selected = items.find((item) => item.id === value);

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-input bg-white px-3 py-2">
        <input type="hidden" name="itemId" value={selected.id} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{selected.name}</p>
          <p className="tabular text-sm text-muted-foreground">{qty(selected.onHand, selected.unit)} on hand</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onChange("");
            setQuery("");
          }}
        >
          Change
        </Button>
      </div>
    );
  }

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = items
    .filter((item) => {
      const haystack = `${item.name} ${item.sku ?? ""}`.toLowerCase();
      return words.every((word) => haystack.includes(word));
    })
    .slice(0, 8);

  return (
    <div>
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-muted-foreground" />
        <input
          id="item-search"
          type="search"
          autoComplete="off"
          placeholder="Type an item name or code"
          aria-invalid={invalid || undefined}
          aria-controls="item-matches"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            // Enter picks the top match instead of sending the half-filled form.
            if (event.key === "Enter") {
              event.preventDefault();
              if (matches[0]) onChange(matches[0].id);
            }
          }}
          className={cn(controlClass, "h-10 pl-10")}
        />
      </div>
      <ul id="item-matches" className="mt-1.5 max-h-72 overflow-y-auto rounded-md border bg-white">
        {matches.map((item) => (
          <li key={item.id} className="border-b last:border-b-0">
            <button
              type="button"
              onClick={() => onChange(item.id)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left outline-none hover:bg-muted focus-visible:bg-muted"
            >
              <span className="min-w-0 truncate font-medium">{item.name}</span>
              <span className="tabular shrink-0 text-sm text-muted-foreground">{qty(item.onHand, item.unit)}</span>
            </button>
          </li>
        ))}
        {matches.length === 0 ? (
          <li className="px-3 py-3 text-sm text-muted-foreground">
            {items.length === 0 ? "No items yet. Add your first item before recording stock." : "No item matches that. Check the spelling, or add it as a new item."}
          </li>
        ) : null}
      </ul>
    </div>
  );
}
