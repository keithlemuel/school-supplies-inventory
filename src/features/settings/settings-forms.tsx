"use client";

import { useState } from "react";

import { Field, FormMessage, TextInput } from "@/components/form";
import { Select } from "@/components/select";
import { Button } from "@/components/ui/button";
import { useFormAction } from "@/components/use-form-action";
import type { CategoryNode } from "@/features/inventory/categories";
import type { Settings } from "@/features/inventory/queries";
import { addCategory, deleteCategory, renameCategory, saveSettings } from "./actions";

export function SettingsForm({ settings }: { settings: Settings }) {
  const { state, pending, onSubmit, action } = useFormAction(saveSettings);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} onSubmit={onSubmit} className="flex flex-col gap-5">
      <FormMessage ok={state.ok} message={state.message} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Stock is aging after"
          htmlFor="agingAfterDays"
          error={errors.agingAfterDays}
          hint="Days since it was received. 90 days is about one school term."
        >
          <TextInput id="agingAfterDays" name="agingAfterDays" inputMode="numeric" defaultValue={settings.agingAfterDays} />
        </Field>
        <Field
          label="Stock is old after"
          htmlFor="oldAfterDays"
          error={errors.oldAfterDays}
          hint="Old stock is listed on the Old stock page to sell off or dispose."
        >
          <TextInput id="oldAfterDays" name="oldAfterDays" inputMode="numeric" defaultValue={settings.oldAfterDays} />
        </Field>
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}

export function AddCategoryForm({ mains }: { mains: { id: string; name: string }[] }) {
  const { state, pending, onSubmit, action } = useFormAction(addCategory);
  return (
    <form action={action} onSubmit={onSubmit} className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-44 flex-1 flex-col gap-1.5 sm:max-w-xs">
          <label htmlFor="category-name" className="text-sm font-semibold">
            New category
          </label>
          <TextInput key={state.stamp ?? 0} id="category-name" name="name" placeholder="Markers" autoComplete="off" />
        </div>
        <div className="flex min-w-44 flex-col gap-1.5">
          <label htmlFor="category-parent" className="text-sm font-semibold">
            Goes inside
          </label>
          <Select
            key={state.stamp ?? 0}
            id="category-parent"
            name="parentId"
            defaultValue=""
            options={[{ value: "", label: "Nothing (a main category)" }, ...mains.map((main) => ({ value: main.id, label: main.name }))]}
          />
        </div>
        <Button type="submit" variant="outline" disabled={pending}>
          Add
        </Button>
      </div>
      {state.fieldErrors?.name ? <p className="text-sm font-medium text-destructive">{state.fieldErrors.name}</p> : null}
      <FormMessage ok={false} message={state.message} />
    </form>
  );
}

/** Main categories with their subcategories indented beneath. Each row can be renamed in place or deleted. */
export function CategoryList({ tree }: { tree: CategoryNode[] }) {
  if (tree.length === 0) return null;
  return (
    <ul className="mb-5 divide-y rounded-md border">
      {tree.map((main) => (
        <li key={main.id}>
          <CategoryRow category={main} />
          {main.children.length > 0 ? (
            <ul className="divide-y border-t bg-muted/40">
              {main.children.map((child) => (
                <li key={child.id}>
                  <CategoryRow category={child} sub />
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function CategoryRow({ category, sub = false }: { category: { id: string; name: string }; sub?: boolean }) {
  const rename = useFormAction(renameCategory);
  const remove = useFormAction(deleteCategory);
  // Renaming stays open until a save goes through: a successful save changes
  // the stamp, which no longer matches the one remembered when it was opened.
  const [opened, setOpened] = useState<{ stamp: number | undefined } | null>(null);
  const editing = opened !== null && opened.stamp === rename.state.stamp;
  const renameError = rename.state.fieldErrors?.name ?? rename.state.message;
  const indent = sub ? "pl-8" : "pl-3";

  if (editing) {
    return (
      <div className={`py-2 pr-1.5 ${indent}`}>
        <form action={rename.action} onSubmit={rename.onSubmit} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={category.id} />
          <TextInput
            name="name"
            defaultValue={category.name}
            aria-label={`New name for ${category.name}`}
            aria-invalid={Boolean(renameError) || undefined}
            autoComplete="off"
            autoFocus
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpened(null);
            }}
            className="h-9 min-w-40 flex-1 sm:max-w-xs"
          />
          <Button type="submit" size="sm" disabled={rename.pending}>
            {rename.pending ? "Saving…" : "Save"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setOpened(null)}>
            Cancel
          </Button>
        </form>
        {renameError ? <p className="mt-1.5 text-sm font-medium text-destructive">{renameError}</p> : null}
      </div>
    );
  }

  return (
    <div className={`py-1.5 pr-1.5 ${indent}`}>
      <div className="flex items-center justify-between gap-3">
        <span className={`min-w-0 truncate ${sub ? "" : "font-semibold"}`}>{category.name}</span>
        <span className="flex shrink-0 items-center">
          <Button variant="ghost" size="sm" onClick={() => setOpened({ stamp: rename.state.stamp })}>
            Rename<span className="sr-only"> {category.name}</span>
          </Button>
          <form action={remove.action} onSubmit={remove.onSubmit}>
            <input type="hidden" name="id" value={category.id} />
            <Button type="submit" variant="ghost" size="sm" disabled={remove.pending} className="text-destructive">
              Delete<span className="sr-only"> {category.name}</span>
            </Button>
          </form>
        </span>
      </div>
      {remove.state.message ? <p className="pb-1 text-sm font-medium text-destructive">{remove.state.message}</p> : null}
    </div>
  );
}
