/**
 * Shared look for text inputs, selects and textareas. Lives outside the
 * client-only form module so Server Components can use the string too.
 */
export const controlClass =
  "w-full rounded-md border border-input bg-white px-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground aria-invalid:border-destructive aria-invalid:ring-destructive/20";

/** For `<select>`: the shared control look plus our own inset chevron. */
export const selectClass = `${controlClass} select-chevron h-10 pr-10`;
