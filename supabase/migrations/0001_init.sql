-- Cashly schema — single-user personal finance app.
-- RLS is intentionally not enabled; the anon key is the only access key used from the mobile app.

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null,
  color text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists envelopes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null,
  color text not null,
  kind text not null check (kind in ('main','safety','bill','limit','goal')),
  balance numeric(14,2) not null default 0,
  allocated numeric(14,2),
  monthly_limit numeric(14,2),
  target numeric(14,2),
  deadline date,
  cadence text check (cadence in ('month','quarter','year')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  amount numeric(12,2) not null,
  category_id uuid references categories(id) on delete restrict,
  envelope_id uuid references envelopes(id) on delete set null,
  note text,
  date date not null,
  created_at timestamptz not null default now()
);

create index if not exists expenses_date_idx on expenses (date desc);
create index if not exists expenses_category_idx on expenses (category_id);
create index if not exists expenses_envelope_idx on expenses (envelope_id);

create table if not exists recurring_payments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric(12,2) not null,
  period text not null check (period in ('weekly','monthly','yearly')),
  next_date date not null,
  is_active boolean not null default true,
  category_id uuid references categories(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists planned_expenses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric(12,2) not null,
  target_date date,
  is_done boolean not null default false,
  category_id uuid references categories(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists incomes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric(12,2) not null,
  kind text not null check (kind in ('recurring','oneoff')),
  next_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Atomic envelope allocation (from_id -> to_id)
create or replace function allocate_envelope(from_id uuid, to_id uuid, amount numeric)
returns void
language plpgsql
as $$
begin
  if amount <= 0 then
    raise exception 'amount must be positive';
  end if;
  update envelopes set balance = balance - amount where id = from_id;
  update envelopes set balance = balance + amount where id = to_id;
end;
$$;

-- Adjust a single envelope's balance by +/- delta
create or replace function adjust_envelope(env_id uuid, delta numeric)
returns void
language plpgsql
as $$
begin
  update envelopes set balance = balance + delta where id = env_id;
end;
$$;

-- Seed default categories (only if table empty)
insert into categories (name, icon, color, is_default)
select * from (values
  ('Еда',          '☕', '#FF9F43', true),
  ('Транспорт',    '🚗', '#5AC8FA', true),
  ('Жильё',        '🏠', '#4FD1C5', true),
  ('Развлечения',  '🎬', '#FF7AA2', true),
  ('Здоровье',     '💊', '#FF6B6B', true),
  ('Покупки',      '🛍️', '#AF82FF', true),
  ('Подписки',     '📱', '#FFD160', true),
  ('Путешествия',  '✈️', '#63E6E2', true),
  ('Подарки',      '🎁', '#F687B3', true),
  ('Прочее',       '📦', '#B0B0B0', true)
) as v(name, icon, color, is_default)
where not exists (select 1 from categories);

-- Seed main envelope
insert into envelopes (name, emoji, color, kind, balance, sort_order)
select 'Основной счёт', '💳', '#5AC8FA', 'main', 0, 0
where not exists (select 1 from envelopes where kind = 'main');
