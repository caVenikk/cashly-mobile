-- Allow tagging an income with the envelope it feeds into.
-- Use case: interest payments on a savings envelope should credit that
-- envelope, not the main account. Null = goes to the main account.

alter table incomes
  add column if not exists envelope_id uuid references envelopes(id) on delete set null;

create index if not exists incomes_envelope_idx on incomes (envelope_id);
