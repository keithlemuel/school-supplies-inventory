import { count } from "@/lib/format";

/** A bigger unit an item also comes in: a box that holds 50 of the smallest unit. */
export type ItemUnit = { id: string; name: string; contains: number; price: number | null };

/** "box (50 pc)": the unit with what it holds, for dropdowns and the price list. */
export function unitLabel(unit: { name: string; contains: number }, baseUnit: string): string {
  return `${unit.name} (${count(unit.contains)} ${baseUnit})`;
}

/**
 * A quantity in the smallest unit, said in the bigger ones: 125 pc with a box
 * of 50 is "2 box + 25 pc". Returns null when there is nothing to break down.
 */
export function inBiggerUnits(quantity: number, baseUnit: string, units: { name: string; contains: number }[]): string | null {
  const bigger = [...units].sort((a, b) => b.contains - a.contains);
  if (bigger.length === 0 || quantity < bigger[bigger.length - 1].contains) return null;

  const parts: string[] = [];
  let left = quantity;
  for (const unit of bigger) {
    const whole = Math.floor(left / unit.contains);
    if (whole > 0) {
      parts.push(`${count(whole)} ${unit.name}`);
      left -= whole * unit.contains;
    }
  }
  if (left > 0) parts.push(`${count(left)} ${baseUnit}`);
  return parts.join(" + ");
}
