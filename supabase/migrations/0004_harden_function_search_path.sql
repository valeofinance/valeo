-- Valeo – Security-Hardening
--
-- Supabase-Advisor "function_search_path_mutable": Funktionen ohne fixierten
-- search_path sind über einen manipulierten search_path angreifbar. is_staff()
-- war in 0001 bereits abgesichert; hier die drei restlichen Helfer.

begin;

alter function public.normalize_domain(text) set search_path = public, pg_temp;
alter function public.is_freemail(citext)    set search_path = public, pg_temp;
alter function public.set_updated_at()       set search_path = public, pg_temp;

commit;
