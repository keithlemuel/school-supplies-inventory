"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "cn";

import { controlClass } from "@/components/control-class";
import { placePanel, useDismiss, useRevealPanel, type Placement } from "@/components/popover";

export type SelectOption = {
  value: string;
  label: string;
  /** For a subcategory: the short name, shown indented under its main category in the open list. */
  nested?: string;
};

/**
 * Our own dropdown, in place of the browser's. It behaves like a native select
 * (arrow keys, Home/End, typing a letter to jump, Enter to pick, Escape to
 * close) and submits through a hidden input, so it works in any form.
 */
export function Select({
  id,
  name,
  options,
  value: controlled,
  defaultValue,
  onChange,
  invalid,
  className,
  "aria-label": ariaLabel,
}: {
  id?: string;
  /** Submitted with the form under this name. Leave it out when the parent keeps the value. */
  name?: string;
  options: SelectOption[];
  /** Pass with `onChange` when the parent keeps the value; otherwise use `defaultValue`. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  invalid?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const autoId = useId();
  const baseId = id ?? autoId;
  const listId = `${baseId}-list`;
  const optionId = (index: number) => `${baseId}-opt-${index}`;

  const [own, setOwn] = useState(defaultValue ?? options[0]?.value ?? "");
  const value = controlled ?? own;
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [active, setActive] = useState(0);
  const open = placement !== null;

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", at: 0 });

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  const close = useCallback(() => setPlacement(null), []);
  useDismiss(rootRef, open, close);
  useRevealPanel(listRef, open);

  // Keep the highlighted option in view as it moves through a long list.
  useEffect(() => {
    if (!open) return;
    // Scrolls the list only, not the page.
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    if (!list || !row) return;
    if (row.offsetTop < list.scrollTop) list.scrollTop = row.offsetTop - 4;
    else if (row.offsetTop + row.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = row.offsetTop + row.offsetHeight - list.clientHeight + 4;
  }, [open, active]);

  function show(index = selectedIndex) {
    if (!triggerRef.current) return;
    const height = Math.min(options.length * 40 + 10, 296);
    setPlacement(placePanel(triggerRef.current, height));
    setActive(index);
  }

  function choose(index: number) {
    const option = options[index];
    if (!option) return;
    setOwn(option.value);
    onChange?.(option.value);
    close();
  }

  /** Finds the next option whose label starts with what was just typed. */
  function match(key: string) {
    const now = Date.now();
    const text = now - typed.current.at < 700 ? typed.current.text + key.toLowerCase() : key.toLowerCase();
    typed.current = { text, at: now };
    const from = open ? active : selectedIndex;
    const order = options.map((_, offset) => (from + (text.length === 1 ? 1 : 0) + offset) % options.length);
    return order.find((index) => options[index].label.toLowerCase().startsWith(text));
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const last = options.length - 1;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        show();
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        show(event.key === "Home" ? 0 : last);
      } else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const found = match(event.key);
        if (found !== undefined) show(found);
      }
      return;
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActive((index) => Math.min(last, index + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActive((index) => Math.max(0, index - 1));
        break;
      case "Home":
      case "PageUp":
        event.preventDefault();
        setActive(0);
        break;
      case "End":
      case "PageDown":
        event.preventDefault();
        setActive(last);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(active);
        break;
      case "Escape":
        event.preventDefault();
        close();
        break;
      case "Tab":
        close();
        break;
      default:
        if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
          const found = match(event.key);
          if (found !== undefined) setActive(found);
        }
    }
  }

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        ref={triggerRef}
        id={baseId}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? optionId(active) : undefined}
        aria-invalid={invalid || undefined}
        onClick={() => (open ? close() : show())}
        onKeyDown={onKeyDown}
        className={cn(
          controlClass,
          "flex h-10 cursor-pointer items-center gap-2 pr-2.5 text-left hover:border-muted-foreground/60",
          open && "border-ring ring-3 ring-ring/25 hover:border-ring",
        )}
      >
        {/* Every label sits in the same cell, so the box is as wide as the longest one and never jumps. */}
        <span className="grid min-w-0 flex-1">
          {options.map((option, index) => (
            <span
              key={option.value}
              aria-hidden={index !== selectedIndex || undefined}
              className={cn("col-start-1 row-start-1 truncate", index !== selectedIndex && "invisible")}
            >
              {option.label}
            </span>
          ))}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-4.5 shrink-0 text-muted-foreground transition-transform duration-150",
            open && "rotate-180 text-ring",
          )}
        />
      </button>

      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabel ? undefined : baseId}
        hidden={!open}
        className={cn(
          "pop-in absolute z-40 max-h-74 min-w-full overflow-y-auto overscroll-contain rounded-lg border border-input bg-white p-1 shadow-[0_12px_32px_-12px_rgb(21_35_29/0.35),0_2px_6px_-2px_rgb(21_35_29/0.12)]",
          placement?.side === "above" ? "bottom-full mb-1.5 origin-bottom" : "top-full mt-1.5 origin-top",
        )}
      >
        {options.map((option, index) => {
          const isSelected = index === selectedIndex;
          const isActive = index === active;
          return (
            <li
              key={option.value}
              id={optionId(index)}
              data-index={index}
              role="option"
              aria-selected={isSelected}
              // Keeps focus on the trigger so the keyboard keeps working after a click.
              onPointerDown={(event) => event.preventDefault()}
              onPointerMove={() => setActive(index)}
              onClick={() => choose(index)}
              className={cn(
                "relative flex min-h-9.5 cursor-pointer items-center gap-2 rounded-md py-1.5 pr-3 whitespace-nowrap select-none",
                option.nested ? "pl-12 text-[0.95rem]" : "pl-8",
                isActive && "bg-board/8",
                isSelected ? "font-semibold text-board" : "text-foreground",
              )}
            >
              {isSelected ? (
                <Check aria-hidden strokeWidth={2.75} className={cn("absolute size-4 text-board", option.nested ? "left-6.5" : "left-2.5")} />
              ) : null}
              {option.nested ? <span aria-hidden className="absolute inset-y-0 left-4 w-px bg-border" /> : null}
              <span className="sr-only">{option.nested ? option.label : null}</span>
              <span aria-hidden={option.nested ? true : undefined}>{option.nested ?? option.label}</span>
              {isActive ? <span aria-hidden className="absolute inset-y-2 left-0 w-0.75 rounded-full bg-pencil" /> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
