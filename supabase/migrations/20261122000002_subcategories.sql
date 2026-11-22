-- Subcategories: a category can sit inside one top-level category
-- (Pens > Markers). Only one level deep.

alter table public.categories
  add column parent_id uuid references public.categories (id) on delete set null;

create index categories_parent_idx on public.categories (parent_id);

-- Names only have to be unique among siblings, so "Pens" can hold a
-- subcategory that is also called "Pens".
drop index public.categories_name_key;
create unique index categories_name_key on public.categories (
  coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid),
  lower(name)
);

create function public.check_category_parent() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.parent_id is null then
    return new;
  end if;
  if new.parent_id = new.id then
    raise exception 'A category cannot go inside itself.';
  end if;
  if exists (select 1 from public.categories where id = new.parent_id and parent_id is not null) then
    raise exception 'Subcategories only go one level deep. Pick a main category.';
  end if;
  if exists (select 1 from public.categories where parent_id = new.id) then
    raise exception 'This category has subcategories of its own, so it cannot go inside another one.';
  end if;
  return new;
end;
$$;

create trigger categories_parent_check
  before insert or update of parent_id on public.categories
  for each row execute function public.check_category_parent();

revoke execute on function public.check_category_parent() from public, anon;

-- The item view also reports the main category, so an item in Pens > Markers
-- can be shown with its full path and found when filtering by Pens.
create or replace view public.item_stock with (security_invoker = true) as
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
  (i.reorder_level > 0 and coalesce(sum(a.quantity_remaining), 0) <= i.reorder_level) as is_low,
  c.parent_id as parent_category_id,
  p.name as parent_category_name
from public.items i
left join public.categories c on c.id = i.category_id
left join public.categories p on p.id = c.parent_id
left join public.batch_ages a on a.item_id = i.id
group by i.id, c.name, c.parent_id, p.name;
