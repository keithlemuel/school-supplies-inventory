/** Why stock went in or out. The keys match the check on stock_movements.reason. */

export const IN_REASONS = {
  delivery: "Delivery from supplier",
  returned: "Returned by a customer",
  recount: "Recount found more",
} as const;

export const OUT_REASONS = {
  sold: "Sold",
  disposed: "Disposed (old stock)",
  damaged: "Damaged",
  given_away: "Given away",
  lost: "Lost or missing",
  recount: "Recount found less",
} as const;

export type InReason = keyof typeof IN_REASONS;
export type OutReason = keyof typeof OUT_REASONS;

const SHORT: Record<string, string> = {
  delivery: "Delivery",
  returned: "Returned",
  sold: "Sold",
  disposed: "Disposed",
  damaged: "Damaged",
  given_away: "Given away",
  lost: "Lost",
};

/** The one-or-two-word label used in history tables. */
export function reasonLabel(direction: string, reason: string): string {
  if (reason === "recount") return direction === "in" ? "Recount, more" : "Recount, less";
  return SHORT[reason] ?? reason;
}
