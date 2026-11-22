"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "cn";

import { controlClass } from "@/components/control-class";
import { placePanel, useDismiss, useRevealPanel, type Placement } from "@/components/popover";

export type Suggestion = {
  /** What goes in the box when it is picked. */
  value: string;
  /** A short second line on the right, such as what is on hand or an address. */
  detail?: string;
};

const MAX_SHOWN = 8;
const ROW_HEIGHT = 44;

/**
 * A text box with our own suggestion list, in place of the browser's
 * `<datalist>`. Anything can be typed; the list only offers what matches, by
 * every word typed, so "bond long" finds "Bond paper, long".
 */
export function Combobox({
  id,
  name,
  value,
  onChange,
  suggestions,
  placeholder,
  invalid,
  className,
  "aria-label": ariaLabel,
}: {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: Suggestion[];
  placeholder?: string;
  invalid?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const autoId = useId();
  const baseId = id ?? autoId;
  const listId = `${baseId}-list`;

  const [placement, setPlacement] = useState<Placement | null>(null);
  const [active, setActive] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const words = value.toLowerCase().split(/\s+/).filter(Boolean);
  const exact = suggestions.some((option) => option.value.toLowerCase() === value.trim().toLowerCase());
  const matches = suggestions
    .filter((option) => words.every((word) => option.value.toLowerCase().includes(word)))
    .slice(0, MAX_SHOWN);
  // Nothing to offer once the box already holds one of the suggestions exactly.
  const open = placement !== null && matches.length > 0 && !(exact && matches.length === 1);

  const close = useCallback(() => {
    setPlacement(null);
    setActive(-1);
  }, []);
  useDismiss(rootRef, placement !== null, close);
  useRevealPanel(listRef, open);

  useEffect(() => {
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    if (!list || !row) return;
    if (row.offsetTop < list.scrollTop) list.scrollTop = row.offsetTop - 4;
    else if (row.offsetTop + row.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = row.offsetTop + row.offsetHeight - list.clientHeight + 4;
  }, [active]);

  function show() {
    if (!inputRef.current || placement) return;
    setPlacement(placePanel(inputRef.current, Math.min(suggestions.length, MAX_SHOWN) * ROW_HEIGHT + 10));
  }

  function pick(index: number) {
    const option = matches[index];
    if (!option) return;
    onChange(option.value);
    close();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!placement) show();
      setActive((index) => Math.min(matches.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter") {
      // Enter picks the highlighted suggestion instead of sending the half-filled form.
      if (open && active >= 0) {
        event.preventDefault();
        pick(active);
      }
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      close();
    } else if (event.key === "Tab") {
      close();
    }
  }

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <input
        ref={inputRef}
        id={baseId}
        name={name}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && active >= 0 ? `${baseId}-opt-${active}` : undefined}
        aria-invalid={invalid || undefined}
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setActive(-1);
          show();
        }}
        onFocus={show}
        onClick={show}
        onKeyDown={onKeyDown}
        className={cn(controlClass, "h-10", open && "border-ring ring-3 ring-ring/25")}
      />

      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label={ariaLabel ? `${ariaLabel}: suggestions` : "Suggestions"}
        hidden={!open}
        className={cn(
          "pop-in absolute z-40 max-h-90 w-full overflow-y-auto overscroll-contain rounded-lg border border-input bg-white p-1 shadow-[0_12px_32px_-12px_rgb(21_35_29/0.35),0_2px_6px_-2px_rgb(21_35_29/0.12)]",
          placement?.side === "above" ? "bottom-full mb-1.5 origin-bottom" : "top-full mt-1.5 origin-top",
        )}
      >
        {matches.map((option, index) => (
          <li
            key={`${option.value}-${index}`}
            id={`${baseId}-opt-${index}`}
            data-index={index}
            role="option"
            aria-selected={index === active}
            // Keeps focus in the box, so typing carries on after a click.
            onPointerDown={(event) => event.preventDefault()}
            onPointerMove={() => setActive(index)}
            onClick={() => pick(index)}
            className={cn(
              "relative flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-md py-1.5 pr-2.5 pl-3 select-none",
              index === active && "bg-board/8",
            )}
          >
            <Highlight text={option.value} words={words} />
            {option.detail ? (
              <span className="tabular max-w-[45%] shrink-0 truncate text-sm text-muted-foreground">{option.detail}</span>
            ) : null}
            {index === active ? <span aria-hidden className="absolute inset-y-2 left-0 w-0.75 rounded-full bg-pencil" /> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The suggestion with the typed words in bold, so it is clear why it matched. */
function Highlight({ text, words }: { text: string; words: string[] }) {
  if (words.length === 0) return <span className="min-w-0 truncate">{text}</span>;
  const pattern = new RegExp(`(${words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return (
    <span className="min-w-0 truncate">
      {text.split(pattern).map((part, index) =>
        index % 2 === 1 ? (
          <strong key={index} className="font-bold text-board">
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </span>
  );
}
