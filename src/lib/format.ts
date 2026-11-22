const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
const whole = new Intl.NumberFormat("en-PH");
const day = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function money(value: number | null | undefined): string {
  return value == null ? "—" : peso.format(value);
}

export function count(value: number | null | undefined): string {
  return whole.format(value ?? 0);
}

/** "12 pc", "1 box". Units are kept as typed; they are short labels, not words to pluralise. */
export function qty(value: number | null | undefined, unit: string | null | undefined): string {
  return `${count(value)} ${unit ?? "pc"}`;
}

/** Formats a calendar date stored as YYYY-MM-DD. */
export function date(value: string | null | undefined): string {
  if (!value) return "—";
  return day.format(new Date(`${value.slice(0, 10)}T00:00:00Z`));
}

/** How long stock has been sitting, in the words someone would say out loud. */
export function age(days: number | null | undefined): string {
  if (days == null) return "—";
  if (days <= 0) return "today";
  if (days === 1) return "1 day";
  if (days < 60) return `${days} days`;
  if (days < 730) return `${Math.floor(days / 30)} months`;
  return `${Math.floor(days / 365)} years`;
}

/** Today's date in the shop's timezone, as YYYY-MM-DD for date inputs. */
export function todayInManila(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
}
