-- Valeo – To-do-Liste: Fälligkeit und Zuständigkeit
--
-- due_at:   optionales Fälligkeitsdatum (überfällig = rote Markierung im UI).
-- assignee: welcher Gründer zuständig ist (auth.users; Auswahl aus staff).

begin;

alter table cockpit_todos add column due_at date;
alter table cockpit_todos add column assignee uuid references auth.users(id) on delete set null;

create index cockpit_todos_assignee_idx on cockpit_todos (assignee);

commit;
