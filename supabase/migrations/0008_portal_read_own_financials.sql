-- Valeo – Portal-Lesezugriff auf eigene Finanzzahlen
--
-- Das Kundenportal-Dashboard zeigt die wichtigsten KPIs (Umsatz, EBITDA-Marge,
-- Liquidität, Ergebnis) und Verläufe. Dafür braucht der Mandant Lesezugriff auf
-- seine eigenen fin_accounts/fin_values – streng über client_users begrenzt.
--
-- Wichtig: Es sind die gemeldeten/unbereinigten Werte. Bereinigungen (EBITDA-
-- Anpassungen etc.) bleiben eine separate, ausschließlich von den Gründern
-- pflegbare Ebene und sind im Portal nicht sichtbar.

begin;

create policy portal_read_fin_accounts on fin_accounts for select
  using (
    client_id in (select client_id from client_users where user_id = auth.uid())
  );

create policy portal_read_fin_values on fin_values for select
  using (
    account_id in (
      select id from fin_accounts
      where client_id in (select client_id from client_users where user_id = auth.uid())
    )
  );

commit;
