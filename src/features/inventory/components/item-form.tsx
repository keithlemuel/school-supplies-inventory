"use client";

import { Field, FormMessage, NativeSelect, TextArea, TextInput } from "@/components/form";
import { LinkButton } from "@/components/link-button";
import { Button } from "@/components/ui/button";
import { useFormAction } from "@/components/use-form-action";
import { saveItem } from "../actions";
import type { ItemStock } from "../queries";

export function ItemForm({
  item,
  categories,
}: {
  item?: ItemStock;
  categories: { id: string; name: string }[];
}) {
  const { state, pending, onSubmit, action } = useFormAction(saveItem);
  const errors = state.fieldErrors ?? {};
  const invalid = (name: string) => Boolean(errors[name]) || undefined;

  return (
    <form action={action} onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-5">
      <FormMessage ok={false} message={state.message} />
      {item ? <input type="hidden" name="id" value={item.id} /> : null}

      <Field label="Item name" htmlFor="name" error={errors.name} hint="The name you look for on the shelf, such as “Notebook, 80 leaves”.">
        <TextInput id="name" name="name" defaultValue={item?.name} autoFocus={!item} aria-invalid={invalid("name")} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Category" htmlFor="categoryId" optional hint="Add more categories in Settings.">
          <NativeSelect id="categoryId" name="categoryId" defaultValue={item?.categoryId ?? ""}>
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Counted by" htmlFor="unit" error={errors.unit} hint="pc, box, ream, pack, pad…">
          <TextInput id="unit" name="unit" defaultValue={item?.unit ?? "pc"} aria-invalid={invalid("unit")} />
        </Field>
        <Field label="Selling price" htmlFor="sellingPrice" optional error={errors.sellingPrice} hint="Per unit, in pesos.">
          <TextInput id="sellingPrice" name="sellingPrice" inputMode="decimal" defaultValue={item?.sellingPrice ?? ""} aria-invalid={invalid("sellingPrice")} />
        </Field>
        <Field
          label="Warn when stock falls to"
          htmlFor="reorderLevel"
          error={errors.reorderLevel}
          hint="The item shows as running low at this number. Use 0 for no warning."
        >
          <TextInput id="reorderLevel" name="reorderLevel" inputMode="numeric" defaultValue={item?.reorderLevel ?? 0} aria-invalid={invalid("reorderLevel")} />
        </Field>
        <Field label="Item code" htmlFor="sku" optional error={errors.sku} hint="Your own code or the barcode number.">
          <TextInput id="sku" name="sku" defaultValue={item?.sku ?? ""} aria-invalid={invalid("sku")} />
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes" optional error={errors.notes}>
        <TextArea id="notes" name="notes" rows={3} defaultValue={item?.notes ?? ""} />
      </Field>

      <div className="flex items-center gap-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : item ? "Save changes" : "Add item"}
        </Button>
        <LinkButton href={item ? `/items/${item.id}` : "/items"} variant="ghost" size="lg">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}
