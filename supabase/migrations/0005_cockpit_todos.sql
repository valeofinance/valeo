-- Valeo – Team-Cockpit To-do-Liste
--
-- Interne "Was liegt an"-Liste für die zwei Gründer (nicht mandantengebunden,
-- daher getrennt von tasks). Live-Sync über Supabase Realtime, damit beide
-- Gründer Ergänzungen und Statuswechsel in Echtzeit sehen.

begin;

create type todo_status as enum ('pending', 'in_progress', 'completed');

create table cockpit_todos (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  status     todo_status not null default 'pending',
  owner      uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cockpit_todos_created_idx on cockpit_todos (created_at);

create trigger cockpit_todos_set_updated_at
  before update on cockpit_todos
  for each row execute function set_updated_at();

alter table cockpit_todos enable row level security;

create policy staff_all_cockpit_todos on cockpit_todos for all
  using (is_staff()) with check (is_staff());

-- Vollständige alte Zeile in DELETE-Events (Realtime).
alter table cockpit_todos replica identity full;

commit;

-- Realtime-Publikation (außerhalb der Transaktion, idempotent gehalten).
alter publication supabase_realtime add table cockpit_todos;
