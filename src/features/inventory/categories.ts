/** Categories are two levels deep at most: a main category and its subcategories. */

export type Category = { id: string; name: string; parent_id: string | null };

export type CategoryNode = { id: string; name: string; children: { id: string; name: string }[] };

/** What sits between a main category and its subcategory when both are shown: "Pens › Markers". */
export const CATEGORY_SEPARATOR = " › ";

export function categoryPath(parent: string | null | undefined, name: string | null | undefined): string | null {
  if (!name) return null;
  return parent ? `${parent}${CATEGORY_SEPARATOR}${name}` : name;
}

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

/** Main categories in name order, each with its subcategories in name order. */
export function categoryTree(categories: Category[]): CategoryNode[] {
  return categories
    .filter((category) => !category.parent_id)
    .sort(byName)
    .map((main) => ({
      id: main.id,
      name: main.name,
      children: categories
        .filter((category) => category.parent_id === main.id)
        .sort(byName)
        .map(({ id, name }) => ({ id, name })),
    }));
}

/**
 * Flat list for a dropdown: each main category followed by its subcategories
 * as "Main › Sub". `nested` is the subcategory's own name, which the open list
 * shows indented under its main category.
 */
export function categoryOptions(categories: Category[]): { id: string; label: string; nested?: string }[] {
  return categoryTree(categories).flatMap((main) => [
    { id: main.id, label: main.name },
    ...main.children.map((child) => ({
      id: child.id,
      label: categoryPath(main.name, child.name) ?? child.name,
      nested: child.name,
    })),
  ]);
}

/** The same list in the shape our Select takes, with an "all" or "none" choice first. */
export function categorySelectOptions(options: { id: string; label: string; nested?: string }[], first: string) {
  return [{ value: "", label: first }, ...options.map(({ id, label, nested }) => ({ value: id, label, nested }))];
}

