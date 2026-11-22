-- Delivery receipts: what a customer (a school, an office) is getting, printed
-- in the store's own receipt format. Saving one takes the inventory items on it
-- out of stock, oldest delivery first, in the same step.
--
-- A line does not have to be an inventory item: the store also delivers things
-- it does not keep stock of, and those lines are simply written on the receipt.

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  address text,
  created_at timestamptz not null default now()
);

create unique index customers_name_key on public.customers (lower(name));

create sequence public.delivery_receipt_number_seq;

create table public.delivery_receipts (
  id uuid primary key default gen_random_uuid(),
  number text not null,
  customer_id uuid references public.customers (id) on delete set null,
  -- Copied onto the receipt, so it still reads the same if the customer is edited later.
  customer_name text not null,
  customer_address text,
  delivered_on date not null,
  total numeric(14, 2) not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index delivery_receipts_number_key on public.delivery_receipts (number);
create index delivery_receipts_recent_idx on public.delivery_receipts (delivered_on desc, created_at desc);

create table public.delivery_receipt_lines (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.delivery_receipts (id) on delete cascade,
  position integer not null,
  item_id uuid references public.items (id) on delete set null,
  description text not null check (length(trim(description)) > 0),
  unit text not null,
  quantity numeric(12, 2) not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  -- What left the shelf, in the item's smallest unit. Null for lines that are not inventory items.
  stock_quantity integer check (stock_quantity > 0)
);

create index delivery_receipt_lines_receipt_idx on public.delivery_receipt_lines (receipt_id, position);

-- Saves a receipt and takes its inventory items out of stock, all or nothing:
-- if one item is short, nothing is saved and the message names the item.
-- p_lines: [{"item_id": uuid|null, "description", "unit", "quantity", "unit_price", "stock_quantity": int|null}]
create function public.create_delivery_receipt(
  p_customer_name text,
  p_customer_address text,
  p_delivered_on date,
  p_number text,
  p_lines jsonb
) returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_receipt uuid;
  v_customer uuid;
  v_name text := trim(coalesce(p_customer_name, ''));
  v_address text := nullif(trim(coalesce(p_customer_address, '')), '');
  v_number text := nullif(trim(coalesce(p_number, '')), '');
  v_date date := coalesce(p_delivered_on, public.today());
  v_line jsonb;
  v_position integer := 0;
  v_total numeric := 0;
  v_item uuid;
  v_item_name text;
begin
  if auth.uid() is null then
    raise exception 'Sign in first.';
  end if;
  if v_name = '' then
    raise exception 'Enter who the delivery is for.';
  end if;
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'Add at least one item to the receipt.';
  end if;
  if v_date > public.today() then
    raise exception 'The date cannot be in the future.';
  end if;

  -- The customer is remembered by name, so the next receipt can fill in the address.
  select id into v_customer from public.customers where lower(name) = lower(v_name);
  if v_customer is null then
    insert into public.customers (name, address) values (v_name, v_address) returning id into v_customer;
  elsif v_address is not null then
    update public.customers set address = v_address where id = v_customer;
  end if;

  if v_number is null then
    loop
      v_number := lpad(nextval('public.delivery_receipt_number_seq')::text, 4, '0');
      exit when not exists (select 1 from public.delivery_receipts where number = v_number);
    end loop;
  elsif exists (select 1 from public.delivery_receipts where number = v_number) then
    raise exception 'Delivery No. % is already used.', v_number;
  end if;

  insert into public.delivery_receipts (number, customer_id, customer_name, customer_address, delivered_on, created_by)
  values (v_number, v_customer, v_name, v_address, v_date, auth.uid())
  returning id into v_receipt;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    v_position := v_position + 1;
    v_item := (v_line ->> 'item_id')::uuid;

    insert into public.delivery_receipt_lines
      (receipt_id, position, item_id, description, unit, quantity, unit_price, stock_quantity)
    values (
      v_receipt,
      v_position,
      v_item,
      trim(v_line ->> 'description'),
      trim(v_line ->> 'unit'),
      (v_line ->> 'quantity')::numeric,
      (v_line ->> 'unit_price')::numeric,
      (v_line ->> 'stock_quantity')::integer
    );
    v_total := v_total + round((v_line ->> 'quantity')::numeric * (v_line ->> 'unit_price')::numeric, 2);

    if v_item is not null then
      begin
        perform public.remove_stock(
          v_item,
          (v_line ->> 'stock_quantity')::integer,
          'sold',
          v_date,
          'Delivery receipt ' || v_number || ', ' || v_name
        );
      exception when raise_exception then
        select name into v_item_name from public.items where id = v_item;
        raise exception '%: %', coalesce(v_item_name, trim(v_line ->> 'description')), sqlerrm;
      end;
    end if;
  end loop;

  update public.delivery_receipts set total = v_total where id = v_receipt;
  return v_receipt;
end;
$$;

alter table public.customers enable row level security;
alter table public.delivery_receipts enable row level security;
alter table public.delivery_receipt_lines enable row level security;

grant select on public.customers, public.delivery_receipts, public.delivery_receipt_lines to authenticated;

create policy "staff read customers" on public.customers for select to authenticated using (true);
create policy "staff read delivery receipts" on public.delivery_receipts for select to authenticated using (true);
create policy "staff read delivery receipt lines" on public.delivery_receipt_lines for select to authenticated using (true);

revoke execute on function public.create_delivery_receipt(text, text, date, text, jsonb) from public, anon;
grant execute on function public.create_delivery_receipt(text, text, date, text, jsonb) to authenticated, service_role;
