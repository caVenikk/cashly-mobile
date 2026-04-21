-- RLS for single-user deployment.
-- Strategy: no user_id columns. Any authenticated session gets full access;
-- anon gets nothing. Safety relies on disabling public signups in Supabase
-- Auth settings so only one account (yours) ever exists.

alter table categories          enable row level security;
alter table envelopes           enable row level security;
alter table expenses            enable row level security;
alter table recurring_payments  enable row level security;
alter table planned_expenses    enable row level security;
alter table incomes             enable row level security;

-- Categories
create policy "auth read categories"   on categories
  for select to authenticated using (true);
create policy "auth write categories"  on categories
  for insert to authenticated with check (true);
create policy "auth update categories" on categories
  for update to authenticated using (true) with check (true);
create policy "auth delete categories" on categories
  for delete to authenticated using (true);

-- Envelopes
create policy "auth read envelopes"    on envelopes
  for select to authenticated using (true);
create policy "auth write envelopes"   on envelopes
  for insert to authenticated with check (true);
create policy "auth update envelopes"  on envelopes
  for update to authenticated using (true) with check (true);
create policy "auth delete envelopes"  on envelopes
  for delete to authenticated using (true);

-- Expenses
create policy "auth read expenses"     on expenses
  for select to authenticated using (true);
create policy "auth write expenses"    on expenses
  for insert to authenticated with check (true);
create policy "auth update expenses"   on expenses
  for update to authenticated using (true) with check (true);
create policy "auth delete expenses"   on expenses
  for delete to authenticated using (true);

-- Recurring payments
create policy "auth read recurring"    on recurring_payments
  for select to authenticated using (true);
create policy "auth write recurring"   on recurring_payments
  for insert to authenticated with check (true);
create policy "auth update recurring"  on recurring_payments
  for update to authenticated using (true) with check (true);
create policy "auth delete recurring"  on recurring_payments
  for delete to authenticated using (true);

-- Planned expenses
create policy "auth read planned"      on planned_expenses
  for select to authenticated using (true);
create policy "auth write planned"     on planned_expenses
  for insert to authenticated with check (true);
create policy "auth update planned"    on planned_expenses
  for update to authenticated using (true) with check (true);
create policy "auth delete planned"    on planned_expenses
  for delete to authenticated using (true);

-- Incomes
create policy "auth read incomes"      on incomes
  for select to authenticated using (true);
create policy "auth write incomes"     on incomes
  for insert to authenticated with check (true);
create policy "auth update incomes"    on incomes
  for update to authenticated using (true) with check (true);
create policy "auth delete incomes"    on incomes
  for delete to authenticated using (true);

-- RPCs: lock down execute privileges so only authenticated calls go through.
revoke execute on function allocate_envelope(uuid, uuid, numeric) from public, anon;
revoke execute on function adjust_envelope(uuid, numeric)         from public, anon;
grant  execute on function allocate_envelope(uuid, uuid, numeric) to authenticated;
grant  execute on function adjust_envelope(uuid, numeric)         to authenticated;
