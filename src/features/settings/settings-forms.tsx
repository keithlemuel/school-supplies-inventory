"use client";

import { Field, FormMessage, TextInput } from "@/components/form";
import { Button } from "@/components/ui/button";
import { useFormAction } from "@/components/use-form-action";
import type { Settings } from "@/features/inventory/queries";
import { addCategory, saveSettings } from "./actions";

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

export function AddCategoryForm() {
  const { state, pending, onSubmit, action } = useFormAction(addCategory);
  return (
    <form action={action} onSubmit={onSubmit} className="flex flex-col gap-1.5">
      <label htmlFor="category-name" className="text-sm font-semibold">
        New category
      </label>
      <div className="flex max-w-sm gap-2">
        <TextInput key={state.stamp ?? 0} id="category-name" name="name" placeholder="Notebooks" autoComplete="off" />
        <Button type="submit" variant="outline" disabled={pending}>
          Add
        </Button>
      </div>
      {state.fieldErrors?.name ? <p className="text-sm font-medium text-destructive">{state.fieldErrors.name}</p> : null}
      <FormMessage ok={false} message={state.message} />
    </form>
  );
}
