"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "cn";

import { Field, FormMessage, NativeSelect, TextInput } from "@/components/form";
import { LinkButton } from "@/components/link-button";
import { Button } from "@/components/ui/button";
import { useFormAction } from "@/components/use-form-action";
import { unitLabel } from "@/features/inventory/units";
import { money, qty } from "@/lib/format";
import { createOrder } from "../actions";
import type { Customer } from "../queries";

/** An inventory item as the order form needs it: its units, prices and what is on hand. */
export type OrderItem = {
  id: string;
  name: string;
  unit: string;
  price: number | null;
  onHand: number;
  units: { id: string; name: string; contains: number; price: number | null }[];
};

type Row = {
  key: number;
  description: string;
  /** Set when the description is exactly one of the inventory items. */
  itemId: string | null;
  unitId: string;
  /** The unit as typed, for things that are not inventory items. */
  unit: string;
  quantity: string;
  price: string;
  /** Once the price is typed by hand, picking another item or unit leaves it alone. */
  priceTyped: boolean;
};

const blankRow = (key: number): Row => ({
  key,
  description: "",
  itemId: null,
  unitId: "",
  unit: "pc",
  quantity: "",
  price: "",
  priceTyped: false,
});

const asPrice = (value: number | null | undefined) => (value == null ? "" : String(value));

export function OrderForm({ items, customers, today }: { items: OrderItem[]; customers: Customer[]; today: string }) {
  const { state, pending, onSubmit, action } = useFormAction(createOrder);
  const errors = state.fieldErrors ?? {};

  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [addressTyped, setAddressTyped] = useState(false);
  const [rows, setRows] = useState<Row[]>(() => [blankRow(0), blankRow(1), blankRow(2)]);
  const [nextKey, setNextKey] = useState(3);

  const byName = new Map(items.map((item) => [item.name.trim().toLowerCase(), item]));
  const byId = new Map(items.map((item) => [item.id, item]));

  const change = (key: number, update: (row: Row) => Row) =>
    setRows((current) => current.map((row) => (row.key === key ? update(row) : row)));

  const describe = (key: number, description: string) =>
    change(key, (row) => {
      const item = byName.get(description.trim().toLowerCase()) ?? null;
      if (!item) return { ...row, description, itemId: null, unitId: "" };
      if (item.id === row.itemId) return { ...row, description };
      return { ...row, description, itemId: item.id, unitId: "", price: row.priceTyped ? row.price : asPrice(item.price) };
    });

  const pickUnit = (key: number, unitId: string) =>
    change(key, (row) => {
      const item = row.itemId ? byId.get(row.itemId) : undefined;
      const unitPrice = unitId ? item?.units.find((unit) => unit.id === unitId)?.price : item?.price;
      return { ...row, unitId, price: row.priceTyped ? row.price : asPrice(unitPrice) };
    });

  const lineTotal = (row: Row) => (Number(row.quantity) || 0) * (Number(row.price) || 0);
  const total = rows.reduce((sum, row) => sum + lineTotal(row), 0);

  return (
    <form action={action} onSubmit={onSubmit} className="flex flex-col gap-6">
      <FormMessage ok={false} message={state.message} />
      <input
        type="hidden"
        name="lines"
        value={JSON.stringify(
          rows.map(({ description, itemId, unitId, unit, quantity, price }) => ({ description, itemId, unitId, unit, quantity, price })),
        )}
      />

      <section className="rounded-lg border bg-card p-4 sm:p-6">
        <h2 className="mb-4 text-xl font-bold">Who it is for</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Sold to" htmlFor="customerName" error={errors.customerName} hint="A school, office or person. Past customers are suggested as you type.">
            <TextInput
              id="customerName"
              name="customerName"
              list="order-customers"
              autoComplete="off"
              value={customerName}
              aria-invalid={Boolean(errors.customerName) || undefined}
              onChange={(event) => {
                const name = event.target.value;
                setCustomerName(name);
                // A known customer brings their address along, unless one was typed already.
                const known = customers.find((customer) => customer.name.toLowerCase() === name.trim().toLowerCase());
                if (known?.address && !addressTyped) setAddress(known.address);
              }}
            />
            <datalist id="order-customers">
              {customers.map((customer) => (
                <option key={customer.id} value={customer.name} />
              ))}
            </datalist>
          </Field>
          <Field label="Address" htmlFor="customerAddress" optional>
            <TextInput
              id="customerAddress"
              name="customerAddress"
              value={address}
              onChange={(event) => {
                setAddress(event.target.value);
                setAddressTyped(true);
              }}
            />
          </Field>
          <Field label="Date" htmlFor="deliveredOn" error={errors.deliveredOn}>
            <TextInput id="deliveredOn" name="deliveredOn" type="date" max={today} defaultValue={today} />
          </Field>
          <Field label="Delivery No." htmlFor="number" optional hint="Leave empty to use the next number.">
            <TextInput id="number" name="number" autoComplete="off" />
          </Field>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-4 sm:p-6">
        <h2 className="text-xl font-bold">What they are getting</h2>
        <p className="mt-1 mb-4 max-w-[70ch] text-muted-foreground">
          Type an item&rsquo;s name and pick it from the suggestions to take it from stock. Anything else you type is
          written on the receipt as it is, and stock is left alone.
        </p>
        <datalist id="order-items">
          {items.map((item) => (
            <option key={item.id} value={item.name} />
          ))}
        </datalist>

        <ul className="flex flex-col gap-4 lg:gap-2.5">
          {rows.map((row, index) => {
            const item = row.itemId ? byId.get(row.itemId) : undefined;
            const n = index + 1;
            return (
              <li key={row.key} className="grid grid-cols-6 items-start gap-x-2 gap-y-1.5 border-b pb-4 last:border-b-0 lg:grid-cols-[minmax(0,1fr)_5.5rem_9.5rem_7rem_7rem_2.25rem] lg:border-b-0 lg:pb-0">
                <div className="col-span-6 lg:col-span-1">
                  <TextInput
                    list="order-items"
                    autoComplete="off"
                    placeholder="Item or description"
                    aria-label={`Line ${n}: item or description`}
                    value={row.description}
                    onChange={(event) => describe(row.key, event.target.value)}
                  />
                  {row.description.trim() ? (
                    <p className={cn("mt-1 text-sm", item ? "text-fresh" : "text-muted-foreground")}>
                      {item ? `From stock: ${qty(item.onHand, item.unit)} on hand` : "Not in the item list, so stock will not change"}
                    </p>
                  ) : null}
                </div>
                <TextInput
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="Qty"
                  aria-label={`Line ${n}: quantity`}
                  value={row.quantity}
                  onChange={(event) => change(row.key, (current) => ({ ...current, quantity: event.target.value }))}
                  className="col-span-2 lg:col-span-1"
                />
                {item ? (
                  <NativeSelect
                    aria-label={`Line ${n}: unit`}
                    value={row.unitId}
                    onChange={(event) => pickUnit(row.key, event.target.value)}
                    className="col-span-4 lg:col-span-1"
                  >
                    <option value="">{item.unit}</option>
                    {item.units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unitLabel(unit, item.unit)}
                      </option>
                    ))}
                  </NativeSelect>
                ) : (
                  <TextInput
                    autoComplete="off"
                    placeholder="Unit"
                    aria-label={`Line ${n}: unit`}
                    value={row.unit}
                    onChange={(event) => change(row.key, (current) => ({ ...current, unit: event.target.value }))}
                    className="col-span-4 lg:col-span-1"
                  />
                )}
                <TextInput
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="Unit price"
                  aria-label={`Line ${n}: unit price`}
                  value={row.price}
                  onChange={(event) => change(row.key, (current) => ({ ...current, price: event.target.value, priceTyped: true }))}
                  className="col-span-3 text-right lg:col-span-1"
                />
                <p className="tabular col-span-2 flex h-10 items-center justify-end font-semibold lg:col-span-1">
                  {lineTotal(row) > 0 ? money(lineTotal(row)) : ""}
                </p>
                <Button
                  variant="ghost"
                  onClick={() => setRows((current) => (current.length > 1 ? current.filter((other) => other.key !== row.key) : [blankRow(row.key)]))}
                  className="col-span-1 px-0 text-muted-foreground"
                >
                  <X />
                  <span className="sr-only">Remove line {n}</span>
                </Button>
              </li>
            );
          })}
        </ul>

        {errors.lines ? <p className="mt-3 text-sm font-medium text-destructive">{errors.lines}</p> : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => {
              setRows((current) => [...current, blankRow(nextKey)]);
              setNextKey(nextKey + 1);
            }}
          >
            <Plus /> Add another line
          </Button>
          <p className="text-lg">
            Total <strong className="tabular ml-2 font-heading text-2xl">{money(total)}</strong>
          </p>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : "Save order and make the receipt"}
        </Button>
        <LinkButton href="/orders" variant="ghost" size="lg">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}
