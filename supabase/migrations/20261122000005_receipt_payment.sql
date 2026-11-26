-- Whether a customer has paid for an order. An order is unpaid until someone
-- marks it paid; the day and who marked it are kept, and marking it unpaid
-- again clears both.

alter table public.delivery_receipts
  add column paid_on date,
  add column paid_by uuid references public.profiles (id) on delete set null;

-- The orders list filters on this, unpaid first.
create index delivery_receipts_paid_idx on public.delivery_receipts ((paid_on is null), delivered_on desc);

-- Marks an order paid (today) or unpaid. Staff only read receipts directly;
-- this is the one change they can make to a saved receipt.
create function public.set_delivery_receipt_paid(p_receipt_id uuid, p_paid boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in first.';
  end if;

  update public.delivery_receipts
  set
    paid_on = case when p_paid then coalesce(paid_on, public.today()) end,
    paid_by = case when p_paid then coalesce(paid_by, auth.uid()) end
  where id = p_receipt_id;

  if not found then
    raise exception 'That order was not found.';
  end if;
end;
$$;

revoke execute on function public.set_delivery_receipt_paid(uuid, boolean) from public, anon;
grant execute on function public.set_delivery_receipt_paid(uuid, boolean) to authenticated, service_role;
