-- Valeo – Fix der Portal-RLS
--
-- Die Policies portal_read_clients und portal_read_tasks (aus 0001) prüfen die
-- Mandantenzugehörigkeit über eine Subquery auf client_users. client_users hatte
-- aber nur die Staff-Policy (is_staff()); für einen Mandanten lieferte die
-- Subquery daher 0 Zeilen und das Kundenportal blieb leer.
--
-- Lösung: Ein Nutzer darf seine eigene Mapping-Zeile lesen. Das reicht der
-- Subquery und gibt keine fremden Zuordnungen preis.

begin;

create policy portal_read_own_client_users on client_users for select
  using (user_id = auth.uid());

commit;
