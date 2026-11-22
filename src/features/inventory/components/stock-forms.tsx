"use client";

import Link from "next/link";
import { useState } from "react";

import { Field, FormMessage, NativeSelect, TextArea, TextInput } from "@/components/form";
import { Button } from "@/components/ui/button";
import { useFormAction } from "@/components/use-form-action";
import { date, qty } from "@/lib/format";
import { stockIn, stockOut } from "../actions";
import type { ItemOption } from "../queries";
import { IN_REASONS, OUT_REASONS } from "../reasons";
import { ItemPicker } from "./item-picker";

export function StockInForm({
  items,
  today,
  defaultItemId,
}: {
  items: ItemOption[];
  today: string;
  defaultItemId?: string;
}) {
  const { state, pending, onSubmit } = useFormAction(stockIn);
  // After a save the fields start fresh for the next item on the delivery.
  const [picked, setPicked] = useState({ stamp: state.stamp, id: defaultItemId ?? "" });
  const itemId = picked.stamp === state.stamp ? picked.id : "";
  const errors = state.fieldErrors ?? {};
  const keep = state.keep ?? {};

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <FormMessage ok={state.ok} message={state.message} />

      <Field label="Item" htmlFor="item-search" error={errors.itemId}>
        <ItemPicker
          key={state.stamp ?? 0}
          items={items}
          value={itemId}
          onChange={(id) => setPicked({ stamp: state.stamp, id })}
          invalid={Boolean(errors.itemId)}
        />
      </Field>

      <div key={state.stamp ?? 0} className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Quantity received" htmlFor="quantity" error={errors.quantity}>
            <TextInput id="quantity" name="quantity" inputMode="numeric" autoComplete="off" aria-invalid={Boolean(errors.quantity) || undefined} />
          </Field>
          <Field
            label="Date received"
            htmlFor="receivedOn"
            error={errors.receivedOn}
            hint="This date is how the stock's age is counted."
          >
            <TextInput id="receivedOn" name="receivedOn" type="date" max={today} defaultValue={keep.receivedOn ?? today} />
          </Field>
          <Field label="Cost per unit" htmlFor="unitCost" optional error={errors.unitCost} hint="What you paid, in pesos.">
            <TextInput id="unitCost" name="unitCost" inputMode="decimal" autoComplete="off" aria-invalid={Boolean(errors.unitCost) || undefined} />
          </Field>
          <Field label="Supplier" htmlFor="supplier" optional error={errors.supplier}>
            <TextInput id="supplier" name="supplier" defaultValue={keep.supplier ?? ""} />
          </Field>
        </div>
        <Field label="Reason" htmlFor="reason">
          <NativeSelect id="reason" name="reason" defaultValue={keep.reason ?? "delivery"}>
            {Object.entries(IN_REASONS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Note" htmlFor="note" optional error={errors.note}>
          <TextArea id="note" name="note" rows={2} />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button type="submit" variant="accent" size="lg" disabled={pending}>
          {pending ? "Adding…" : "Add stock"}
        </Button>
        <Link href="/items/new" className="text-sm font-medium text-link underline-offset-4 hover:underline">
          Item not in the list? Add it first
        </Link>
      </div>
    </form>
  );
}

export type BatchChoice = { id: string; itemId: string; receivedOn: string; quantityRemaining: number };

export function StockOutForm({
  items,
  today,
  defaultItemId,
  defaultReason,
  batch,
}: {
  items: ItemOption[];
  today: string;
  defaultItemId?: string;
  defaultReason?: string;
  /** Set when the person came from a particular delivery and wants to take from that one. */
  batch?: BatchChoice;
}) {
  const { state, pending, onSubmit } = useFormAction(stockOut);
  const [picked, setPicked] = useState({ stamp: state.stamp, id: defaultItemId ?? "", useBatch: Boolean(batch) });
  const fresh = picked.stamp === state.stamp;
  const itemId = fresh ? picked.id : "";
  const fromBatch = fresh && picked.useBatch && batch && batch.itemId === itemId ? batch : undefined;
  const item = items.find((option) => option.id === itemId);
  const errors = state.fieldErrors ?? {};
  const keep = state.keep ?? {};
  const available = fromBatch ? fromBatch.quantityRemaining : item?.onHand;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <FormMessage ok={state.ok} message={state.message} />

      <Field label="Item" htmlFor="item-search" error={errors.itemId}>
        <ItemPicker
          key={state.stamp ?? 0}
          items={items}
          value={itemId}
          onChange={(id) => setPicked({ stamp: state.stamp, id, useBatch: picked.useBatch && fresh })}
          invalid={Boolean(errors.itemId)}
        />
      </Field>

      <input type="hidden" name="batchId" value={fromBatch?.id ?? ""} />
      {item ? (
        <p className="-mt-2 rounded-md bg-muted px-3 py-2 text-sm">
          {fromBatch ? (
            <>
              Taking from the delivery received <strong>{date(fromBatch.receivedOn)}</strong>, which has{" "}
              {qty(fromBatch.quantityRemaining, item.unit)} left.{" "}
              <button
                type="button"
                onClick={() => setPicked({ stamp: state.stamp, id: itemId, useBatch: false })}
                className="font-medium text-link underline-offset-4 hover:underline"
              >
                Use the oldest stock instead
              </button>
            </>
          ) : item.onHand === 0 ? (
            "Nothing on hand for this item, so there is nothing to take out."
          ) : (
            <>
              Stock comes off the oldest delivery first
              {item.oldestReceivedOn ? <> (received {date(item.oldestReceivedOn)})</> : null}.
            </>
          )}
        </p>
      ) : null}

      <div key={state.stamp ?? 0} className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Quantity going out"
            htmlFor="quantity"
            error={errors.quantity}
            hint={available != null && item ? `Up to ${qty(available, item.unit)}.` : undefined}
          >
            <TextInput id="quantity" name="quantity" inputMode="numeric" autoComplete="off" aria-invalid={Boolean(errors.quantity) || undefined} />
          </Field>
          <Field label="Date" htmlFor="occurredOn" error={errors.occurredOn}>
            <TextInput id="occurredOn" name="occurredOn" type="date" max={today} defaultValue={keep.occurredOn ?? today} />
          </Field>
        </div>
        <Field label="Reason" htmlFor="reason" error={errors.reason}>
          <NativeSelect id="reason" name="reason" defaultValue={keep.reason ?? defaultReason ?? "sold"}>
            {Object.entries(OUT_REASONS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Note" htmlFor="note" optional error={errors.note}>
          <TextArea id="note" name="note" rows={2} />
        </Field>
      </div>

      <div>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Taking out…" : "Take out stock"}
        </Button>
      </div>
    </form>
  );
}
