"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "cn";

import { controlClass } from "@/components/control-class";
import { placePanel, useDismiss, useRevealPanel, type Placement } from "@/components/popover";

/*
  Dates are YYYY-MM-DD strings, the same as the database and the old date
  inputs. All the arithmetic is done in UTC so the day never shifts with the
  device's timezone.
*/

const DAY = 86_400_000;
const PANEL_WIDTH = 296;
const PANEL_HEIGHT = 380;

const toTime = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const toIso = (time: number) => new Date(time).toISOString().slice(0, 10);
const addDays = (iso: string, days: number) => toIso(toTime(iso) + days * DAY);
const monthOf = (iso: string) => iso.slice(0, 7);

/** Same day in another month, pulled back to the month's last day when it has fewer days. */
function addMonths(iso: string, months: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1 + months, 1));
  const days = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  first.setUTCDate(Math.min(d, days));
  return toIso(first.getTime());
}

const fmt = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-PH", { ...options, timeZone: "UTC" });
const triggerFormat = fmt({ weekday: "short", month: "short", day: "numeric", year: "numeric" });
const monthFormat = fmt({ month: "long", year: "numeric" });
const fullFormat = fmt({ weekday: "long", month: "long", day: "numeric", year: "numeric" });
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** The days to draw for a month: blanks before the 1st so it lands under its weekday. */
function monthGrid(month: string) {
  const first = `${month}-01`;
  const lead = new Date(toTime(first)).getUTCDay();
  const length = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let day = 0; day < length; day++) cells.push(addDays(first, day));
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let start = 0; start < cells.length; start += 7) weeks.push(cells.slice(start, start + 7));
  return weeks;
}

/**
 * Our own date field, in place of the browser's. A calendar opens under the
 * field with the chosen day filled in and today marked; days after `max` can't
 * be picked. Today and Yesterday are one tap, since most entries are one of the two.
 */
export function DatePicker({
  id,
  name,
  defaultValue,
  today,
  max,
  invalid,
}: {
  id: string;
  name: string;
  defaultValue: string;
  /** The shop's today, from the server, so it matches the dates already saved. */
  today: string;
  max?: string;
  /** Set when the field has an error; the Field's error text is read out with the date. */
  invalid?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  const [placement, setPlacement] = useState<Placement | null>(null);
  // The day the keyboard is on, and so which month is showing.
  const [focus, setFocus] = useState(defaultValue);
  const open = placement !== null;

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLTableElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);
  const titleId = useId();

  const allowed = (iso: string) => !max || iso <= max;
  const clamp = (iso: string) => (max && iso > max ? max : iso);

  const close = useCallback(() => setPlacement(null), []);
  useDismiss(rootRef, open, close);
  useRevealPanel(panelRef, open);

  // After the keyboard moves the day, put focus on it (it may be in a month that just rendered).
  useEffect(() => {
    if (!open || !moveFocus.current) return;
    moveFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${focus}"]`)?.focus({ preventScroll: true });
  }, [open, focus]);

  function show() {
    if (!triggerRef.current) return;
    setPlacement(placePanel(triggerRef.current, PANEL_HEIGHT, PANEL_WIDTH));
    setFocus(value);
    moveFocus.current = true;
  }

  function hide() {
    close();
    triggerRef.current?.focus();
  }

  function pick(iso: string) {
    if (!allowed(iso)) return;
    setValue(iso);
    hide();
  }

  function go(iso: string) {
    moveFocus.current = true;
    setFocus(clamp(iso));
  }

  function onGridKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    const weekday = new Date(toTime(focus)).getUTCDay();
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDays(focus, -1),
      ArrowRight: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7),
      ArrowDown: () => addDays(focus, 7),
      Home: () => addDays(focus, -weekday),
      End: () => addDays(focus, 6 - weekday),
      PageUp: () => addMonths(focus, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focus, event.shiftKey ? 12 : 1),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    go(move());
  }

  const month = monthOf(focus);
  const canGoNext = !max || monthOf(max) > month;
  const yesterday = addDays(today, -1);
  const relative = value === today ? "Today" : value === yesterday ? "Yesterday" : null;

  return (
    <div
      ref={rootRef}
      className="relative w-full"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          hide();
        }
      }}
    >
      <input type="hidden" name={name} value={value} />
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        // The Field's label, then the date itself, so a screen reader says both.
        aria-labelledby={`${id}-label ${id}-value`}
        aria-describedby={invalid ? `${id}-error` : undefined}
        onClick={() => (open ? close() : show())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            show();
          }
        }}
        className={cn(
          controlClass,
          "flex h-10 cursor-pointer items-center gap-2.5 text-left hover:border-muted-foreground/60",
          invalid && "border-destructive ring-3 ring-destructive/20",
          open && "border-ring ring-3 ring-ring/25 hover:border-ring",
        )}
      >
        <CalendarDays aria-hidden className={cn("size-4.5 shrink-0 text-muted-foreground", open && "text-ring")} />
        <span id={`${id}-value`} className="tabular min-w-0 flex-1 truncate">{triggerFormat.format(toTime(value))}</span>
        {relative ? (
          <span className="shrink-0 rounded-full bg-pencil/30 px-2 py-0.5 text-xs font-semibold text-board-deep">{relative}</span>
        ) : null}
      </button>

      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-labelledby={titleId}
          className={cn(
            "pop-in absolute z-40 w-74 rounded-xl border border-input bg-white p-3 shadow-[0_16px_40px_-14px_rgb(21_35_29/0.4),0_2px_6px_-2px_rgb(21_35_29/0.12)]",
            placement.side === "above" ? "bottom-full mb-1.5 origin-bottom" : "top-full mt-1.5 origin-top",
            placement.align === "end" ? "right-0" : "left-0",
          )}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setFocus(clamp(addMonths(focus, -1)))}
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <ChevronLeft className="size-4.5" />
              <span className="sr-only">Previous month</span>
            </button>
            <div id={titleId} aria-live="polite" className="font-heading text-base font-bold text-board">
              {monthFormat.format(toTime(`${month}-01`))}
            </div>
            <button
              type="button"
              disabled={!canGoNext}
              onClick={() => setFocus(clamp(addMonths(focus, 1)))}
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight className="size-4.5" />
              <span className="sr-only">Next month</span>
            </button>
          </div>

          <table ref={gridRef} aria-labelledby={titleId} onKeyDown={onGridKeyDown} className="w-full border-collapse">
            <thead>
              <tr>
                {WEEKDAYS.map((day, index) => (
                  <th key={day} scope="col" abbr={WEEKDAY_NAMES[index]} className="pb-1 text-xs font-semibold text-muted-foreground">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthGrid(month).map((week, row) => (
                <tr key={row}>
                  {week.map((day, col) =>
                    day ? (
                      <td key={day} className="p-0.5 text-center">
                        <DayButton
                          day={day}
                          selected={day === value}
                          isToday={day === today}
                          disabled={!allowed(day)}
                          tabbable={day === focus}
                          onPick={pick}
                        />
                      </td>
                    ) : (
                      <td key={`blank-${col}`} />
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-2 flex items-center gap-1.5 border-t pt-2.5">
            {[
              { label: "Today", day: today },
              { label: "Yesterday", day: yesterday },
            ].map((quick) => (
              <button
                key={quick.label}
                type="button"
                disabled={!allowed(quick.day)}
                onClick={() => pick(quick.day)}
                className={cn(
                  "h-8 rounded-full border px-3 text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-40",
                  value === quick.day ? "border-board bg-board text-white" : "border-input bg-white hover:bg-muted",
                )}
              >
                {quick.label}
              </button>
            ))}
            <span className="ml-auto text-xs text-muted-foreground">
              <kbd className="font-sans">←↑→↓</kbd> to move
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DayButton({
  day,
  selected,
  isToday,
  disabled,
  tabbable,
  onPick,
}: {
  day: string;
  selected: boolean;
  isToday: boolean;
  disabled: boolean;
  tabbable: boolean;
  onPick: (day: string) => void;
}) {
  return (
    <button
      type="button"
      data-day={day}
      tabIndex={tabbable ? 0 : -1}
      aria-label={fullFormat.format(toTime(day))}
      aria-pressed={selected}
      aria-current={isToday ? "date" : undefined}
      aria-disabled={disabled || undefined}
      onClick={() => onPick(day)}
      className={cn(
        "tabular relative mx-auto flex size-9 items-center justify-center rounded-lg text-[0.95rem] outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/45",
        selected
          ? "bg-board font-bold text-white hover:bg-board-deep"
          : disabled
            ? "cursor-not-allowed text-muted-foreground/40"
            : "font-medium text-foreground hover:bg-board/8",
        isToday && !selected && "font-bold text-board",
      )}
    >
      {Number(day.slice(8))}
      {/* Today gets a pencil-yellow mark under the number. */}
      {isToday ? (
        <span aria-hidden className={cn("absolute bottom-1 h-0.75 w-3.5 rounded-full", selected ? "bg-pencil" : "bg-pencil-deep")} />
      ) : null}
    </button>
  );
}
