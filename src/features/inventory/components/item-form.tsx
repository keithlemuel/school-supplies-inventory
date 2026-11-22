"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import { Field, FormMessage, NativeSelect, TextArea, TextInput } from "@/components/form";
import { LinkButton } from "@/components/link-button";
import { Button } from "@/components/ui/button";
import { useFormAction } from "@/components/use-form-action";
import { saveItem } from "../actions";
import type { ItemStock } from "../queries";
import type { ItemUnit } from "../units";

type UnitRow = { key: number; name: string; contains: string; price: string };

export function ItemForm({
  item,
  units = [],
  categories,
}: {
  item?: ItemStock;
  /** The bigger units the item already has. */
  units?: ItemUnit[];
  /** Dropdown choices, subcategories already labelled with their main category. */
  categories: { id: string; label: string }[];
}) {
  const { state, pending, onSubmit, action } = useFormAction(saveItem);
  const errors = state.fieldErrors ?? {};
  const invalid = (name: string) => Boolean(errors[name]) || undefined;

  const [baseUnit, setBaseUnit] = useState(item?.unit ?? "pc");
  const [rows, setRows] = useState<UnitRow[]>(() =>
    units.map((unit, index) => ({
      key: index,
      name: unit.name,
      contains: String(unit.contains),
      price: unit.price == null ? "" : String(unit.price),
    })),
  );
  const [nextKey, setNextKey] = useState(units.length);
  const smallest = baseUnit.trim() || "unit";

  const update = (key: number, change: Partial<UnitRow>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...change } : row)));

  return (
    <form action={action} onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-5">
      <FormMessage ok={false} message={state.message} />
      {item ? <input type="hidden" name="id" value={item.id} /> : null}

      <Field label="Item name" htmlFor="name" error={errors.name} hint="The name you look for on the shelf, such as “Notebook, 80 leaves”.">
        <TextInput id="name" name="name" defaultValue={item?.name} autoFocus={!item} aria-invalid={invalid("name")} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Category" htmlFor="categoryId" optional hint="Add categories and subcategories in Settings.">
          <NativeSelect id="categoryId" name="categoryId" defaultValue={item?.categoryId ?? ""}>
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Item code" htmlFor="sku" optional error={errors.sku} hint="Your own code or the barcode number.">
          <TextInput id="sku" name="sku" defaultValue={item?.sku ?? ""} aria-invalid={invalid("sku")} />
        </Field>
        <Field
          label="Smallest unit"
          htmlFor="unit"
          error={errors.unit}
          hint="The smallest unit you sell it in. Stock is counted in this: pc, pack, sheet…"
        >
          <TextInput
            id="unit"
            name="unit"
            value={baseUnit}
            onChange={(event) => setBaseUnit(event.target.value)}
            aria-invalid={invalid("unit")}
          />
        </Field>
        <Field label={`Price per ${smallest}`} htmlFor="sellingPrice" optional error={errors.sellingPrice} hint="In pesos.">
          <TextInput id="sellingPrice" name="sellingPrice" inputMode="decimal" defaultValue={item?.sellingPrice ?? ""} aria-invalid={invalid("sellingPrice")} />
        </Field>
      </div>

      <fieldset className="rounded-md border p-4">
        <legend className="px-1 text-sm font-semibold">
          Bigger units <span className="font-normal text-muted-foreground">(optional)</span>
        </legend>
        <p className="text-sm text-muted-foreground">
          If you also buy or sell this by the box, ream or bundle, add each one with how many {smallest} it holds and
          its own price. You can then record stock in any of them.
        </p>

        {rows.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-3">
            {rows.map((row) => (
              <li key={row.key} className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <TextInput
                  name="unitName"
                  value={row.name}
                  onChange={(event) => update(row.key, { name: event.target.value })}
                  placeholder="box"
                  aria-label="Unit name"
                  autoComplete="off"
                  className="w-28"
                />
                <span className="text-sm text-muted-foreground">holds</span>
                <TextInput
                  name="unitContains"
                  value={row.contains}
                  onChange={(event) => update(row.key, { contains: event.target.value })}
                  inputMode="numeric"
                  placeholder="50"
                  aria-label={`How many ${smallest} it holds`}
                  autoComplete="off"
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">{smallest}, sells for ₱</span>
                <TextInput
                  name="unitPrice"
                  value={row.price}
                  onChange={(event) => update(row.key, { price: event.target.value })}
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-label="Price for this unit"
                  autoComplete="off"
                  className="w-28"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRows((current) => current.filter((other) => other.key !== row.key))}
                  className="px-2 text-muted-foreground"
                >
                  <X />
                  <span className="sr-only">Remove {row.name || "this unit"}</span>
                </Button>
              </li>
            ))}
          </ul>
        ) : null}

        {errors.units ? <p className="mt-2 text-sm font-medium text-destructive">{errors.units}</p> : null}

        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => {
            setRows((current) => [...current, { key: nextKey, name: "", contains: "", price: "" }]);
            setNextKey(nextKey + 1);
          }}
        >
          <Plus /> Add a unit
        </Button>
      </fieldset>

      <Field
        label="Warn when stock falls to"
        htmlFor="reorderLevel"
        error={errors.reorderLevel}
        hint={`Counted in ${smallest}. The item shows as running low at this number. Use 0 for no warning.`}
        className="sm:max-w-xs"
      >
        <TextInput id="reorderLevel" name="reorderLevel" inputMode="numeric" defaultValue={item?.reorderLevel ?? 0} aria-invalid={invalid("reorderLevel")} />
      </Field>

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
