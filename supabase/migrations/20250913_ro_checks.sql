-- Catalog-safe boolean helpers (SECURITY DEFINER; no data access)
-- Run with: supabase db push

create or replace function public.ro_check_extension(ext_name text)
returns boolean
language sql
security definer
set search_path = public, pg_catalog
as $$
  select exists (select 1 from pg_extension where extname = ext_name);
$$;

create or replace function public.ro_check_table(sch text, tbl text)
returns boolean
language sql
security definer
set search_path = public, pg_catalog
as $$
  select to_regclass(format('%I.%I', sch, tbl)) is not null;
$$;

create or replace function public.ro_check_rls(sch text, tbl text)
returns boolean
language sql
security definer
set search_path = public, pg_catalog
as $$
  select (select relrowsecurity from pg_class where oid = format('%I.%I', sch, tbl)::regclass)::boolean;
$$;

create or replace function public.ro_check_policy(sch text, tbl text, pol text)
returns boolean
language sql
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1 from pg_policies
    where schemaname = sch and tablename = tbl and policyname = pol
  );
$$;

grant execute on function public.ro_check_extension(text) to anon;
grant execute on function public.ro_check_table(text, text) to anon;
grant execute on function public.ro_check_rls(text, text) to anon;
grant execute on function public.ro_check_policy(text, text, text) to anon;
