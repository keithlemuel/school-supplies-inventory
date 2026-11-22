"use client";

import Link from "next/link";
import { useState } from "react";

import { DatePicker } from "@/components/date-picker";
import { Field, FormMessage, TextArea, TextInput } from "@/components/form";
import { Select } from "@/components/select";
import { Button } from "@/components/ui/button";
import { useFormAction } from "@/components/use-form-action";
import { date, qty } from "@/lib/format";
import { stockIn, stockOut } from "../actions";
import type { ItemOption } from "../queries";
import { IN_REASONS, OUT_REASONS } from "../reasons";
import { unitLabel } from "../units";
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
  const { state, pending, onSubmit, action } = useFormAction(stockIn);
  // After a save the fields start fresh for the next item on the delivery.
  const [picked, setPicked] = useState({ stamp: state.stamp, id: defaultItemId ?? "" });
  const itemId = picked.stamp === state.stamp ? picked.id : "";
  const item = items.find((option) => option.id === itemId);
  const errors = state.fieldErrors ?? {};
  const keep = state.keep ?? {};

  return (
    <form action={action} onSubmit={onSubmit} className="flex flex-col gap-5">
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

      {item && item.onHand > 0 ? (
        <p className="-mt-2 rounded-md bg-muted px-3 py-2 text-sm">
          <strong>{qty(item.onHand, item.unit)}</strong> already on the shelf
          {item.oldestReceivedOn ? <>, the oldest received {date(item.oldestReceivedOn)}</> : null}. What you add now is
          kept as a separate delivery, so you will still see how much of the older stock is left.
        </p>
      ) : null}

      <div key={state.stamp ?? 0} className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Quantity received" htmlFor="quantity" error={errors.quantity}>
            <QuantityWithUnit item={item} invalid={Boolean(errors.quantity)} />
          </Field>
          <Field
            label="Date received"
            htmlFor="receivedOn"
            error={errors.receivedOn}
            hint="This date is how the stock's age is counted."
          >
            <DatePicker
              id="receivedOn"
              name="receivedOn"
              today={today}
              max={today}
              defaultValue={keep.receivedOn ?? today}
              invalid={Boolean(errors.receivedOn)}
            />
          </Field>
          <Field
            label="Cost per unit"
            htmlFor="unitCost"
            optional
            error={errors.unitCost}
            hint={item && item.units.length > 0 ? "What you paid for one of the unit picked above." : "What you paid, in pesos."}
          >
            <TextInput id="unitCost" name="unitCost" inputMode="decimal" autoComplete="off" aria-invalid={Boolean(errors.unitCost) || undefined} />
          </Field>
          <Field label="Supplier" htmlFor="supplier" optional error={errors.supplier}>
            <TextInput id="supplier" name="supplier" defaultValue={keep.supplier ?? ""} />
          </Field>
        </div>
        <Field label="Reason" htmlFor="reason">
          <Select
            id="reason"
            name="reason"
            defaultValue={keep.reason ?? "delivery"}
            options={Object.entries(IN_REASONS).map(([value, label]) => ({ value, label }))}
          />
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

/**
 * The quantity box, with a unit dropdown beside it when the item also comes in
 * bigger units (2 box instead of 100 pc). The dropdown starts over when the item changes.
 */
function QuantityWithUnit({ item, invalid }: { item: ItemOption | undefined; invalid: boolean }) {
  return (
    <div className="flex gap-2">
      <TextInput
        id="quantity"
        name="quantity"
        inputMode="numeric"
        autoComplete="off"
        aria-invalid={invalid || undefined}
        className="min-w-0 flex-1"
      />
      {item && item.units.length > 0 ? (
        <Select
          key={item.id}
          name="unitId"
          aria-label="Unit"
          defaultValue=""
          options={[{ value: "", label: item.unit }, ...item.units.map((unit) => ({ value: unit.id, label: unitLabel(unit, item.unit) }))]}
          className="w-auto max-w-[55%]"
        />
      ) : null}
    </div>
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
  const { state, pending, onSubmit, action } = useFormAction(stockOut);
  const [picked, setPicked] = useState({ stamp: state.stamp, id: defaultItemId ?? "", useBatch: Boolean(batch) });
  const fresh = picked.stamp === state.stamp;
  const itemId = fresh ? picked.id : "";
  const fromBatch = fresh && picked.useBatch && batch && batch.itemId === itemId ? batch : undefined;
  const item = items.find((option) => option.id === itemId);
  const errors = state.fieldErrors ?? {};
  const keep = state.keep ?? {};
  const available = fromBatch ? fromBatch.quantityRemaining : item?.onHand;

  return (
    <form action={action} onSubmit={onSubmit} className="flex flex-col gap-5">
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
            <QuantityWithUnit item={item} invalid={Boolean(errors.quantity)} />
          </Field>
          <Field label="Date" htmlFor="occurredOn" error={errors.occurredOn}>
            <DatePicker
              id="occurredOn"
              name="occurredOn"
              today={today}
              max={today}
              defaultValue={keep.occurredOn ?? today}
              invalid={Boolean(errors.occurredOn)}
            />
          </Field>
        </div>
        <Field label="Reason" htmlFor="reason" error={errors.reason}>
          <Select
            id="reason"
            name="reason"
            defaultValue={keep.reason ?? defaultReason ?? "sold"}
            options={Object.entries(OUT_REASONS).map(([value, label]) => ({ value, label }))}
          />
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
