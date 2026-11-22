-- Bigger units for an item: vellum board is counted by the pack, and is also
-- bought and sold by the ream and by the box.
--
-- Stock is always kept in the item's smallest unit (items.unit). Each row here
-- says how many of that smallest unit one bigger unit holds, and what it sells
-- for. Stock in and stock out can be entered in any of them.

create table public.item_units (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  -- How many of the item's smallest unit one of these holds: a box of 50 pc holds 50.
  contains integer not null check (contains > 1),
  selling_price numeric(12, 2) check (selling_price >= 0),
  created_at timestamptz not null default now()
);

create unique index item_units_name_key on public.item_units (item_id, lower(name));

-- Replaces an item's bigger units in one go, so a half-saved list is never left behind.
-- p_units is a list of {"name": "box", "contains": 50, "price": 275} (price may be null).
create function public.set_item_units(p_item_id uuid, p_units jsonb) returns void
language plpgsql
set search_path = ''
as $$
begin
  delete from public.item_units where item_id = p_item_id;

  insert into public.item_units (item_id, name, contains, selling_price)
  select
    p_item_id,
    trim(unit ->> 'name'),
    (unit ->> 'contains')::integer,
    (unit ->> 'price')::numeric
  from jsonb_array_elements(coalesce(p_units, '[]'::jsonb)) as unit;
end;
$$;

alter table public.item_units enable row level security;

grant select, insert, update, delete on public.item_units to authenticated;

create policy "staff read item units" on public.item_units for select to authenticated using (true);
create policy "staff add item units" on public.item_units for insert to authenticated with check (true);
create policy "staff edit item units" on public.item_units for update to authenticated using (true) with check (true);
create policy "staff delete item units" on public.item_units for delete to authenticated using (true);

revoke execute on function public.set_item_units(uuid, jsonb) from public, anon;
grant execute on function public.set_item_units(uuid, jsonb) to authenticated, service_role;
