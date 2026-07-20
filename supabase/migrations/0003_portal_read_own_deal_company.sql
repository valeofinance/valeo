-- Valeo – Portal-Lesezugriff auf eigenen Deal und Company
--
-- Das Kundenportal zeigt Paket (aus deals) und Agenturname (aus companies) des
-- eigenen Mandanten. Ohne Policy sind deals/companies rein intern (nur Staff),
-- die Nested-Selects im Portal liefen daher leer ("Ihre Agentur", Paket "—").
--
-- Beide Policies sind streng auf den eigenen Deal/die eigene Company begrenzt
-- (Kette client_users -> clients -> deals -> companies über auth.uid()).

begin;

create policy portal_read_deals on deals for select
  using (
    id in (
      select deal_id from clients
      where id in (select client_id from client_users where user_id = auth.uid())
    )
  );

create policy portal_read_companies on companies for select
  using (
    id in (
      select company_id from deals
      where id in (
        select deal_id from clients
        where id in (select client_id from client_users where user_id = auth.uid())
      )
    )
  );

commit;
