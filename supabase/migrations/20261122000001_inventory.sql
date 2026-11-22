-- School supplies inventory.
--
-- Every delivery is kept as its own batch with the date it was received, so
-- the shop can always tell old stock from new. Taking stock out uses up the
-- oldest batch first. Batches and the stock ledger are only ever written by
-- the two functions at the bottom, so on-hand numbers cannot drift.

-- The shop's calendar day (the database clock runs on UTC).
create function public.today() returns date
language sql stable
set search_path = ''
as $$ select (now() at time zone 'Asia/Manila')::date $$;

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  created_at timestamptz not null default now()
);

-- Every sign-in gets a profile, whether it was made by the create-user script
-- or from the Supabase dashboard.
create function public.handle_new_user() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    lower(new.email),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Settings (one row)
-- ---------------------------------------------------------------------------

create table public.settings (
  id boolean primary key default true check (id),
  -- A batch is "aging" once it has sat this many days, and "old" after the second number.
  aging_after_days integer not null default 90 check (aging_after_days > 0),
  old_after_days integer not null default 180,
  constraint old_is_later_than_aging check (old_after_days > aging_after_days)
);

insert into public.settings default values;

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create unique index categories_name_key on public.categories (lower(name));

create table public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  sku text,
  category_id uuid references public.categories (id) on delete set null,
  -- How the item is counted: pc, box, ream, pack, pad...
  unit text not null default 'pc',
  selling_price numeric(12, 2) check (selling_price >= 0),
  -- Flag the item as low when on-hand falls to this number. 0 turns the flag off.
  reorder_level integer not null default 0 check (reorder_level >= 0),
  notes text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index items_name_key on public.items (lower(name));
create unique index items_sku_key on public.items (lower(sku)) where sku is not null;
create index items_category_idx on public.items (category_id);

-- ---------------------------------------------------------------------------
-- Stock: batches and the ledger
-- ---------------------------------------------------------------------------

-- One row per delivery of one item.
create table public.stock_batches (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete restrict,
  received_on date not null,
  quantity_received integer not null check (quantity_received > 0),
  quantity_remaining integer not null check (quantity_remaining >= 0),
  unit_cost numeric(12, 2) check (unit_cost >= 0),
  supplier text,
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint remaining_within_received check (quantity_remaining <= quantity_received)
);

create index stock_batches_open_idx on public.stock_batches (item_id, received_on, created_at)
  where quantity_remaining > 0;

-- Everything that went in or out, and why. Never edited; a mistake is fixed
-- with a new entry in the other direction.
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete restrict,
  batch_id uuid not null references public.stock_batches (id) on delete restrict,
  direction text not null check (direction in ('in', 'out')),
  reason text not null,
  quantity integer not null check (quantity > 0),
  occurred_on date not null,
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint reason_matches_direction check (
    (direction = 'in' and reason in ('delivery', 'returned', 'recount'))
    or (direction = 'out' and reason in ('sold', 'damaged', 'disposed', 'given_away', 'lost', 'recount'))
  )
);

create index stock_movements_recent_idx on public.stock_movements (occurred_on desc, created_at desc);
create index stock_movements_item_idx on public.stock_movements (item_id, occurred_on desc, created_at desc);

-- ---------------------------------------------------------------------------
-- Views the app reads
-- ---------------------------------------------------------------------------

-- Batches that still have stock, with their age and whether they count as
-- new, aging or old under the shop's settings.
create view public.batch_ages with (security_invoker = true) as
select
  b.id,
  b.item_id,
  i.name as item_name,
  i.unit,
  i.is_archived,
  b.received_on,
  b.quantity_received,
  b.quantity_remaining,
  b.unit_cost,
  b.supplier,
  b.note,
  b.created_at,
  public.today() - b.received_on as age_days,
  case
    when public.today() - b.received_on >= s.old_after_days then 'old'
    when public.today() - b.received_on >= s.aging_after_days then 'aging'
    else 'new'
  end as age_band,
  b.quantity_remaining * coalesce(b.unit_cost, 0) as remaining_value
from public.stock_batches b
join public.items i on i.id = b.item_id
cross join public.settings s
where b.quantity_remaining > 0;

-- One row per item with what is on hand and how old the oldest of it is.
create view public.item_stock with (security_invoker = true) as
select
  i.id,
  i.name,
  i.sku,
  i.unit,
  i.category_id,
  c.name as category_name,
  i.selling_price,
  i.reorder_level,
  i.notes,
  i.is_archived,
  coalesce(sum(a.quantity_remaining), 0)::integer as on_hand,
  coalesce(sum(a.quantity_remaining) filter (where a.age_band = 'old'), 0)::integer as old_quantity,
  coalesce(sum(a.quantity_remaining) filter (where a.age_band = 'aging'), 0)::integer as aging_quantity,
  coalesce(sum(a.remaining_value), 0)::numeric(14, 2) as stock_value,
  min(a.received_on) as oldest_received_on,
  max(a.age_days) as oldest_age_days,
  count(a.id)::integer as open_batches,
  (i.reorder_level > 0 and coalesce(sum(a.quantity_remaining), 0) <= i.reorder_level) as is_low
from public.items i
left join public.categories c on c.id = i.category_id
left join public.batch_ages a on a.item_id = i.id
group by i.id, c.name;

-- ---------------------------------------------------------------------------
-- Stock in / stock out
-- ---------------------------------------------------------------------------

-- Records a delivery as a new batch. Returns the batch id.
create function public.receive_stock(
  p_item_id uuid,
  p_quantity integer,
  p_received_on date default null,
  p_unit_cost numeric default null,
  p_supplier text default null,
  p_note text default null,
  p_reason text default 'delivery'
) returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_batch uuid;
  v_date date := coalesce(p_received_on, public.today());
begin
  if auth.uid() is null then
    raise exception 'Sign in first.';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Enter a quantity above zero.';
  end if;
  if v_date > public.today() then
    raise exception 'The date received cannot be in the future.';
  end if;
  if p_reason not in ('delivery', 'returned', 'recount') then
    raise exception 'Pick a reason for adding the stock.';
  end if;
  if not exists (select 1 from public.items where id = p_item_id and not is_archived) then
    raise exception 'That item is not in the list any more.';
  end if;

  insert into public.stock_batches
    (item_id, received_on, quantity_received, quantity_remaining, unit_cost, supplier, note, created_by)
  values
    (p_item_id, v_date, p_quantity, p_quantity, p_unit_cost,
     nullif(trim(p_supplier), ''), nullif(trim(p_note), ''), auth.uid())
  returning id into v_batch;

  insert into public.stock_movements
    (item_id, batch_id, direction, reason, quantity, occurred_on, note, created_by)
  values
    (p_item_id, v_batch, 'in', p_reason, p_quantity, v_date, nullif(trim(p_note), ''), auth.uid());

  return v_batch;
end;
$$;

-- Takes stock out, oldest batch first. Pass p_batch_id to take it from one
-- particular batch instead (used when clearing out a specific old delivery).
create function public.remove_stock(
  p_item_id uuid,
  p_quantity integer,
  p_reason text,
  p_occurred_on date default null,
  p_note text default null,
  p_batch_id uuid default null
) returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_left integer := p_quantity;
  v_take integer;
  v_available integer;
  v_unit text;
  v_date date := coalesce(p_occurred_on, public.today());
  b record;
begin
  if auth.uid() is null then
    raise exception 'Sign in first.';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Enter a quantity above zero.';
  end if;
  if v_date > public.today() then
    raise exception 'The date cannot be in the future.';
  end if;
  if p_reason not in ('sold', 'damaged', 'disposed', 'given_away', 'lost', 'recount') then
    raise exception 'Pick a reason for taking the stock out.';
  end if;

  -- Locking the item makes two people taking out the same item wait their turn.
  select unit into v_unit from public.items where id = p_item_id for update;
  if not found then
    raise exception 'That item is not in the list any more.';
  end if;

  select coalesce(sum(quantity_remaining), 0) into v_available
  from public.stock_batches
  where item_id = p_item_id and (p_batch_id is null or id = p_batch_id);

  if v_available < p_quantity then
    if p_batch_id is null then
      raise exception 'Only % % in stock.', v_available, v_unit;
    else
      raise exception 'Only % % left in that delivery.', v_available, v_unit;
    end if;
  end if;

  for b in
    select id, quantity_remaining
    from public.stock_batches
    where item_id = p_item_id
      and quantity_remaining > 0
      and (p_batch_id is null or id = p_batch_id)
    order by received_on, created_at
  loop
    exit when v_left = 0;
    v_take := least(b.quantity_remaining, v_left);

    update public.stock_batches
    set quantity_remaining = quantity_remaining - v_take
    where id = b.id;

    insert into public.stock_movements
      (item_id, batch_id, direction, reason, quantity, occurred_on, note, created_by)
    values
      (p_item_id, b.id, 'out', p_reason, v_take, v_date, nullif(trim(p_note), ''), auth.uid());

    v_left := v_left - v_take;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Access: signed-in staff only. Nobody else can read or change anything.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.categories enable row level security;
alter table public.items enable row level security;
alter table public.stock_batches enable row level security;
alter table public.stock_movements enable row level security;

revoke all on all tables in schema public from anon, authenticated;

grant select on public.profiles, public.stock_batches, public.stock_movements,
  public.batch_ages, public.item_stock to authenticated;
grant select, update on public.settings to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update on public.items to authenticated;

create policy "staff read profiles" on public.profiles for select to authenticated using (true);
create policy "staff read settings" on public.settings for select to authenticated using (true);
create policy "staff edit settings" on public.settings for update to authenticated using (true) with check (true);
create policy "staff read categories" on public.categories for select to authenticated using (true);
create policy "staff add categories" on public.categories for insert to authenticated with check (true);
create policy "staff edit categories" on public.categories for update to authenticated using (true) with check (true);
create policy "staff delete categories" on public.categories for delete to authenticated using (true);
create policy "staff read items" on public.items for select to authenticated using (true);
create policy "staff add items" on public.items for insert to authenticated with check (true);
create policy "staff edit items" on public.items for update to authenticated using (true) with check (true);
create policy "staff read batches" on public.stock_batches for select to authenticated using (true);
create policy "staff read movements" on public.stock_movements for select to authenticated using (true);

revoke execute on all functions in schema public from public, anon;
grant execute on function public.today() to authenticated, service_role;
grant execute on function public.receive_stock(uuid, integer, date, numeric, text, text, text) to authenticated, service_role;
grant execute on function public.remove_stock(uuid, integer, text, date, text, uuid) to authenticated, service_role;
