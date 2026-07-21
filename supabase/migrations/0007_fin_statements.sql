-- Valeo – Finanzabschlüsse (GuV, Bilanz, Cashflow)
--
-- Importierte Werte sind "reported"/unbereinigt (Lehrbuch). KPIs wie EBITDA
-- werden daraus ohne Anpassung berechnet; Bereinigungen kommen später als
-- separate, ausschließlich von den Gründern pflegbare Overlay-Ebene
-- (fin_adjustments). Diese Migration legt erst die Rohdatenschicht + das
-- Grid-Fundament an.
--
-- Modell:
--   fin_accounts  Kontenzeilen je Mandant/Statement (Bereich, Code, Label)
--   fin_values    Zellen: Konto × Periode = Betrag (unbereinigt)

begin;

create type statement_type as enum ('income', 'balance', 'cashflow');

create table fin_accounts (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients(id) on delete cascade,
  statement  statement_type not null,
  section    text,
  code       text,
  label      text not null,
  sort       int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index fin_accounts_key_idx
  on fin_accounts (client_id, statement, coalesce(code, label));
create index fin_accounts_client_stmt_idx
  on fin_accounts (client_id, statement, sort);

create trigger fin_accounts_set_updated_at
  before update on fin_accounts
  for each row execute function set_updated_at();

create table fin_values (
  id         uuid primary key default gen_random_uuid(),
  account_id uuid not null references fin_accounts(id) on delete cascade,
  period_key text not null,
  amount     numeric(16,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index fin_values_key_idx on fin_values (account_id, period_key);

create trigger fin_values_set_updated_at
  before update on fin_values
  for each row execute function set_updated_at();

alter table fin_accounts enable row level security;
alter table fin_values   enable row level security;

create policy staff_all_fin_accounts on fin_accounts for all
  using (is_staff()) with check (is_staff());
create policy staff_all_fin_values on fin_values for all
  using (is_staff()) with check (is_staff());

commit;
