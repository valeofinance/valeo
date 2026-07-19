-- Valeo – Kern-Datenmodell (Akquise → Mandant → Aufgaben)
--
-- Siehe docs/spec.md § 7. Diese Migration legt die sieben Kern-Tabellen an,
-- die Dedupe-Constraints aus § 8 und ein RLS-Fundament aus § 6 (Akquise-Modul
-- "zwingt zu sauberem Auth- und RLS-Fundament").
--
-- Grundprinzip RLS:
--   * Staff (die beiden Gründer) sehen und ändern alles -> is_staff().
--   * Mandanten (Kundenportal) sehen ausschließlich ihren eigenen client-Datensatz
--     und die daran hängenden Aufgaben -> Mapping client_users.
--   * Rohdaten und Akquise (raw_events, companies, contacts, deals, activities)
--     sind rein intern, kein Portalzugriff.
--
-- Stripe ist System of Record für alles Vertragliche. Hier stehen nur Referenzen
-- (stripe_customer_id o. ä.), keine Preise/Laufzeiten.

begin;

create extension if not exists pgcrypto;      -- gen_random_uuid()
create extension if not exists citext;         -- case-insensitive E-Mail/Domain

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type deal_phase as enum (
  'neu', 'kontaktiert', 'qualifiziert', 'angebot', 'gewonnen', 'verloren'
);

create type activity_typ as enum ('mail', 'call', 'notiz');

create type onboarding_status as enum (
  'offen', 'in_arbeit', 'aktiv', 'pausiert', 'beendet'
);

create type execution_mode as enum ('auto', 'draft', 'manual');

create type task_status as enum (
  'offen', 'in_arbeit', 'wartet_freigabe', 'erledigt', 'abgebrochen'
);

-- ---------------------------------------------------------------------------
-- Hilfsfunktionen
-- ---------------------------------------------------------------------------

-- Domain-Normalisierung: lowercase, Whitespace weg, führendes "www." entfernen,
-- Schema/Pfad abschneiden falls eine URL reinkommt.
create or replace function normalize_domain(raw text)
returns citext
language sql
immutable
as $$
  select nullif(
    regexp_replace(
      regexp_replace(lower(trim(raw)), '^https?://', ''),  -- Schema weg
      '^www\.|/.*$', '', 'g'                                 -- www. + Pfad weg
    ),
    ''
  )::citext
$$;

-- Freemail-Domains, die nicht als Company-Schlüssel taugen (§ 8).
create or replace function is_freemail(domain citext)
returns boolean
language sql
immutable
as $$
  select domain in (
    'gmail.com','googlemail.com','web.de','gmx.de','gmx.net','t-online.de',
    'yahoo.com','yahoo.de','hotmail.com','hotmail.de','outlook.com','outlook.de',
    'live.com','icloud.com','me.com','aol.com','freenet.de','mail.de','posteo.de'
  )
$$;

-- updated_at-Trigger
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Staff & Portal-Mapping (Basis für RLS)
-- ---------------------------------------------------------------------------

-- Die beiden Gründer. Eintrag = interner Vollzugriff.
create table staff (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

create or replace function is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from staff where user_id = auth.uid())
$$;

-- ---------------------------------------------------------------------------
-- raw_events – roher Lead-Ingest, Replay-fähig (§ 8)
-- ---------------------------------------------------------------------------

create table raw_events (
  id           uuid primary key default gen_random_uuid(),
  source       text not null,
  payload      jsonb not null,
  received_at  timestamptz not null default now(),
  processed_at timestamptz,
  error        text
);

-- Noch nicht verarbeitete Events schnell finden (Worker-Queue).
create index raw_events_unprocessed_idx
  on raw_events (received_at)
  where processed_at is null;

-- ---------------------------------------------------------------------------
-- companies – Domain als natürlicher Schlüssel (normalisiert, kein Freemail)
-- ---------------------------------------------------------------------------

create table companies (
  id         uuid primary key default gen_random_uuid(),
  domain     citext unique not null,
  name       text,
  enrichment jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint companies_domain_not_freemail check (not is_freemail(domain))
);

create trigger companies_set_updated_at
  before update on companies
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- contacts – E-Mail als natürlicher Schlüssel, Upsert statt Insert (§ 8)
-- ---------------------------------------------------------------------------

create table contacts (
  id         uuid primary key default gen_random_uuid(),
  email      citext unique not null,
  company_id uuid references companies(id) on delete set null,
  name       text,
  rolle      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contacts_company_id_idx on contacts (company_id);

create trigger contacts_set_updated_at
  before update on contacts
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- deals – ein offener Deal pro Company (§ 8)
-- ---------------------------------------------------------------------------

create table deals (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references companies(id) on delete cascade,
  phase          deal_phase not null default 'neu',
  paket          text,
  wert           numeric(12,2),
  owner          uuid references auth.users(id) on delete set null,
  source         text,
  next_action_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- "Ein offener Deal pro Company": offen = nicht gewonnen/verloren.
create unique index deals_one_open_per_company_idx
  on deals (company_id)
  where phase not in ('gewonnen', 'verloren');

create index deals_owner_idx          on deals (owner);
create index deals_next_action_at_idx on deals (next_action_at)
  where phase not in ('gewonnen', 'verloren');

create trigger deals_set_updated_at
  before update on deals
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- activities – Historie am Deal (weitere Leads hängen hier an, § 8)
-- ---------------------------------------------------------------------------

create table activities (
  id         uuid primary key default gen_random_uuid(),
  deal_id    uuid not null references deals(id) on delete cascade,
  typ        activity_typ not null,
  inhalt     text,
  created_at timestamptz not null default now()
);

create index activities_deal_id_idx on activities (deal_id, created_at desc);

-- ---------------------------------------------------------------------------
-- clients – der Lead wird zum Mandanten, ohne Datenkopie (clients.deal_id, § 7)
-- ---------------------------------------------------------------------------

create table clients (
  id                 uuid primary key default gen_random_uuid(),
  deal_id            uuid not null unique references deals(id) on delete restrict,
  stripe_customer_id text unique,
  onboarding_status  onboarding_status not null default 'offen',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger clients_set_updated_at
  before update on clients
  for each row execute function set_updated_at();

-- Portal-Zugänge: welcher auth-User darf welchen Mandanten sehen.
create table client_users (
  client_id  uuid not null references clients(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, user_id)
);

create index client_users_user_id_idx on client_users (user_id);

-- ---------------------------------------------------------------------------
-- tasks – Aufgabenpipeline mit drei Ausführungsmodi (§ 9)
-- ---------------------------------------------------------------------------

create table tasks (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references clients(id) on delete cascade,
  titel          text not null,
  execution_mode execution_mode not null,
  status         task_status not null default 'offen',
  due_at         timestamptz,
  owner          uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index tasks_client_id_idx on tasks (client_id);
create index tasks_due_at_idx    on tasks (due_at)
  where status not in ('erledigt', 'abgebrochen');
create index tasks_owner_idx     on tasks (owner);

create trigger tasks_set_updated_at
  before update on tasks
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table staff        enable row level security;
alter table raw_events   enable row level security;
alter table companies    enable row level security;
alter table contacts     enable row level security;
alter table deals        enable row level security;
alter table activities   enable row level security;
alter table clients      enable row level security;
alter table client_users enable row level security;
alter table tasks        enable row level security;

-- Interne Tabellen: nur Staff, voller Zugriff. Service-Role (Ingest-Worker,
-- Cron) umgeht RLS ohnehin.
create policy staff_all_raw_events on raw_events for all
  using (is_staff()) with check (is_staff());
create policy staff_all_companies on companies for all
  using (is_staff()) with check (is_staff());
create policy staff_all_contacts on contacts for all
  using (is_staff()) with check (is_staff());
create policy staff_all_deals on deals for all
  using (is_staff()) with check (is_staff());
create policy staff_all_activities on activities for all
  using (is_staff()) with check (is_staff());
create policy staff_all_client_users on client_users for all
  using (is_staff()) with check (is_staff());

-- Staff darf die eigene staff-Tabelle lesen (für is_staff-Checks im Client).
create policy staff_read_staff on staff for select
  using (is_staff());

-- clients: Staff voll, Portal-User nur den eigenen Mandanten (read-only).
create policy staff_all_clients on clients for all
  using (is_staff()) with check (is_staff());
create policy portal_read_clients on clients for select
  using (
    exists (
      select 1 from client_users cu
      where cu.client_id = clients.id and cu.user_id = auth.uid()
    )
  );

-- tasks: Staff voll, Portal-User liest die Aufgaben des eigenen Mandanten.
create policy staff_all_tasks on tasks for all
  using (is_staff()) with check (is_staff());
create policy portal_read_tasks on tasks for select
  using (
    exists (
      select 1 from client_users cu
      where cu.client_id = tasks.client_id and cu.user_id = auth.uid()
    )
  );

commit;
