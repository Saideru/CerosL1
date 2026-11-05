-- =====================================================================
-- Ceros_db : Supabase (PostgreSQL) schema for the CerosL1 Calculator
-- ---------------------------------------------------------------------
-- How to run: Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
--
-- Contents
--   0) Helpers (username -> login email)
--   1) RBAC: user_type_tb, permission_tb, user_type_permission_tb
--   2) user_tb            (username + user_type, linked to Supabase Auth)
--   3) activity_log_tb    (trace logs shown in the admin interface)
--   4) vat_tb
--   5) payment_tb
--   6) journal_balancer_tb (+ view journal_balancer_summary)
--   7) statement_check_tb
--   8) aging_tb            (+ view aging_summary)
--   9) Row Level Security policies (driven by the RBAC tables)
--  10) Seed accounts: Kamteam (admin) and Sample Client (client)
--
-- Conventions
--   * Money is stored as whole CENTAVOS (bigint): PHP 1,234.56 -> 123456
--   * Results are GENERATED columns, so they always match the inputs.
--   * Passwords live in Supabase Auth (auth.users), never in user_tb.
--   * Users sign in with a USERNAME. Supabase Auth needs an email, so each
--     username maps to an internal login address, e.g.
--       'Sample Client' -> 'sample.client@cerosl1.local'
--     The app does the same mapping in src/lib/supabase.ts.
--   * The user's REAL email address (entered when registering) is stored
--     in user_tb.email as contact information for the administrator.
--   * PostgreSQL lowercases unquoted names: "VAT_tb" is vat_tb.
--
-- The script is safe to run more than once.
--
-- If you already ran an EARLIER version of this file (user_tb with an
-- email/role column), run this reset block once first. It deletes the
-- CerosL1 tables and the data in them:
--
--   drop view  if exists public.journal_balancer_summary, public.aging_summary;
--   drop table if exists public.vat_tb, public.payment_tb, public.journal_balancer_tb,
--                        public.statement_check_tb, public.aging_tb, public.user_tb cascade;
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;


-- =====================================================================
-- 0) Helpers
-- =====================================================================

-- Must match usernameToEmail() in src/lib/supabase.ts
create or replace function public.username_to_email(p_username text)
returns text
language sql
immutable
set search_path = ''
as $$
  select btrim(regexp_replace(lower(btrim(p_username)), '[^a-z0-9]+', '.', 'g'), '.')
         || '@cerosl1.local';
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;


-- =====================================================================
-- 1) RBAC  (Role-Based Access Control)
--    user_type_tb            : the roles  (admin, client)
--    permission_tb           : what can be done
--    user_type_permission_tb : which role has which permission
--    Every RLS policy below checks public.has_permission('<permission>').
-- =====================================================================
create table if not exists public.user_type_tb (
  user_type    text primary key,
  label        text not null,
  description  text not null
);

create table if not exists public.permission_tb (
  permission   text primary key,
  description  text not null
);

create table if not exists public.user_type_permission_tb (
  user_type    text not null references public.user_type_tb (user_type) on delete cascade,
  permission   text not null references public.permission_tb (permission) on delete cascade,
  primary key (user_type, permission)
);

insert into public.user_type_tb (user_type, label, description) values
  ('admin',  'Administrator', 'Manages client accounts and reviews trace logs and usage graphs.'),
  ('client', 'Client',        'Uses the CerosL1 calculators for their own business.')
on conflict (user_type) do update
  set label = excluded.label, description = excluded.description;

insert into public.permission_tb (permission, description) values
  ('calculator.use',        'Use the six CerosL1 calculators'),
  ('calculation.save',      'Save own calculations'),
  ('calculation.view_all',  'View the saved calculations of every client'),
  ('activity.log_own',      'Record own activity in the trace log'),
  ('activity.view_all',     'View the trace logs of every user'),
  ('profile.update_own',    'Edit own name, email, company and initials'),
  ('clients.view',          'View all user accounts'),
  ('clients.manage',        'Activate / deactivate accounts and change their user type')
on conflict (permission) do update
  set description = excluded.description;

insert into public.user_type_permission_tb (user_type, permission) values
  -- client
  ('client', 'calculator.use'),
  ('client', 'calculation.save'),
  ('client', 'activity.log_own'),
  ('client', 'profile.update_own'),
  -- admin (everything)
  ('admin',  'calculator.use'),
  ('admin',  'calculation.save'),
  ('admin',  'calculation.view_all'),
  ('admin',  'activity.log_own'),
  ('admin',  'activity.view_all'),
  ('admin',  'profile.update_own'),
  ('admin',  'clients.view'),
  ('admin',  'clients.manage')
on conflict do nothing;


-- =====================================================================
-- 2) user_tb  -- one profile per Supabase Auth user
-- =====================================================================
create table if not exists public.user_tb (
  id               uuid primary key references auth.users (id) on delete cascade,
  username         text not null
                   check (username ~ '^[A-Za-z0-9][A-Za-z0-9 ._-]{2,29}$'),
  full_name        text not null check (length(btrim(full_name)) > 0),
  email            text,
  user_type        text not null default 'client'
                   references public.user_type_tb (user_type),
  company_name     text not null default 'My Company Inc.',
  avatar_initials  varchar(2),
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Upgrade path: adds the email column if user_tb was created without it
alter table public.user_tb add column if not exists email text;

alter table public.user_tb drop constraint if exists user_tb_email_format;
alter table public.user_tb add constraint user_tb_email_format
  check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

-- Usernames and emails are unique regardless of upper/lower case
create unique index if not exists user_tb_username_key
  on public.user_tb (lower(username));
create unique index if not exists user_tb_email_key
  on public.user_tb (lower(email));

-- RBAC helpers (security definer so they can read user_tb under RLS)
create or replace function public.current_user_type()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select user_type from public.user_tb
  where id = auth.uid() and is_active;
$$;

create or replace function public.has_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_tb u
    join public.user_type_permission_tb tp on tp.user_type = u.user_type
    where u.id = auth.uid()
      and u.is_active
      and tp.permission = p_permission
  );
$$;

-- Guard: only admins may change user_type / is_active / username,
-- and nobody may demote or deactivate themselves (prevents lock-out).
create or replace function public.protect_user_tb()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- auth.uid() is null when run from the SQL editor / service role: allow
  if auth.uid() is not null then
    if (new.user_type is distinct from old.user_type
        or new.is_active is distinct from old.is_active
        or new.username  is distinct from old.username)
       and not public.has_permission('clients.manage') then
      raise exception 'Only an administrator can change user type, status or username.';
    end if;

    if old.id = auth.uid()
       and (new.user_type is distinct from old.user_type or new.is_active = false) then
      raise exception 'You cannot change your own user type or deactivate your own account.';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists user_tb_protect on public.user_tb;
create trigger user_tb_protect
  before update on public.user_tb
  for each row execute function public.protect_user_tb();

-- Auto-create the profile when someone signs up.
-- The app passes username, full_name, company_name, contact_email in signUp() metadata.
-- New accounts are ALWAYS 'client'; only an admin can promote them.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text := coalesce(nullif(btrim(new.raw_user_meta_data ->> 'username'), ''),
                              split_part(new.email, '@', 1));
  v_name     text := coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), v_username);
  v_company  text := coalesce(nullif(btrim(new.raw_user_meta_data ->> 'company_name'), ''),
                              'My Company Inc.');
  v_email    text := nullif(lower(btrim(new.raw_user_meta_data ->> 'contact_email')), '');
  v_parts    text[] := regexp_split_to_array(v_name, '\s+');
  v_initials text;
begin
  if array_length(v_parts, 1) > 1 then
    v_initials := upper(left(v_parts[1], 1) || left(v_parts[array_length(v_parts, 1)], 1));
  else
    v_initials := upper(left(v_name, 2));
  end if;

  insert into public.user_tb (id, username, full_name, email, user_type, company_name, avatar_initials)
  values (new.id, v_username, v_name, v_email, 'client', v_company, v_initials);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- =====================================================================
-- 3) activity_log_tb  -- trace log of what each user does
-- =====================================================================
create table if not exists public.activity_log_tb (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid()
              references public.user_tb (id) on delete cascade,
  action      text not null check (action in (
                'sign_in', 'sign_out', 'sign_up',
                'open_calculator', 'export_csv', 'copy_csv',
                'run_acceptance_tests',
                'client_activated', 'client_deactivated', 'user_type_changed'
              )),
  calculator  text check (calculator in (
                'vat', 'invoice_bill', 'payment', 'balancer', 'statement', 'aging'
              )),
  details     jsonb not null default '{}'::jsonb,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists activity_log_tb_created_idx on public.activity_log_tb (created_at desc);
create index if not exists activity_log_tb_user_idx    on public.activity_log_tb (user_id, created_at desc);


-- =====================================================================
-- 4) vat_tb  -- saved VAT calculations
-- =====================================================================
create table if not exists public.vat_tb (
  id               bigint generated always as identity primary key,
  user_id          uuid        not null default auth.uid()
                               references public.user_tb (id) on delete cascade,
  mode             text        not null check (mode in ('add', 'extract')),
  tax_rate_code    text        not null default 'vat_12'
                               check (tax_rate_code in ('vat_12', 'zero_rated', 'vat_exempt')),
  -- 'add' -> input is the NET amount; 'extract' -> input is the GROSS amount
  input_centavos   bigint      not null check (input_centavos >= 0),

  tax_rate         numeric(5, 4) generated always as (
                     case when tax_rate_code = 'vat_12' then 0.12 else 0 end
                   ) stored,
  net_centavos     bigint generated always as (
                     case
                       when mode = 'add' then input_centavos
                       when tax_rate_code <> 'vat_12' then input_centavos
                       else round(input_centavos / 1.12)::bigint
                     end
                   ) stored,
  vat_centavos     bigint generated always as (
                     case
                       when tax_rate_code <> 'vat_12' then 0
                       when mode = 'add' then round(input_centavos * 0.12)::bigint
                       else input_centavos - round(input_centavos / 1.12)::bigint
                     end
                   ) stored,
  gross_centavos   bigint generated always as (
                     case
                       when mode = 'extract' then input_centavos
                       when tax_rate_code <> 'vat_12' then input_centavos
                       else input_centavos + round(input_centavos * 0.12)::bigint
                     end
                   ) stored,

  created_at       timestamptz not null default now()
);

create index if not exists vat_tb_user_id_idx on public.vat_tb (user_id, created_at desc);


-- =====================================================================
-- 5) payment_tb  -- settlement of an invoice (received) or bill (paid)
-- =====================================================================
create table if not exists public.payment_tb (
  id                          bigint generated always as identity primary key,
  user_id                     uuid    not null default auth.uid()
                                      references public.user_tb (id) on delete cascade,
  doc_type                    text    not null check (doc_type in ('invoice', 'bill')),
  document_reference          text    not null check (length(btrim(document_reference)) > 0),
  payment_date                date    not null default current_date,

  document_total_centavos     bigint  not null check (document_total_centavos > 0),
  already_paid_centavos       bigint  not null default 0 check (already_paid_centavos >= 0),
  payment_centavos            bigint  not null check (payment_centavos > 0),

  amount_due_before_centavos  bigint generated always as (
                                document_total_centavos - already_paid_centavos
                              ) stored,
  amount_due_after_centavos   bigint generated always as (
                                document_total_centavos - already_paid_centavos - payment_centavos
                              ) stored,
  status                      text generated always as (
                                case
                                  when document_total_centavos - already_paid_centavos - payment_centavos = 0
                                    then 'Paid'
                                  else 'Awaiting payment'
                                end
                              ) stored,

  created_at                  timestamptz not null default now(),

  constraint payment_paid_not_over_total
    check (already_paid_centavos <= document_total_centavos),
  constraint payment_not_over_amount_due
    check (payment_centavos <= document_total_centavos - already_paid_centavos)
);

create index if not exists payment_tb_user_id_idx   on public.payment_tb (user_id, payment_date desc);
create index if not exists payment_tb_reference_idx on public.payment_tb (user_id, document_reference);


-- =====================================================================
-- 6) journal_balancer_tb  -- one row per journal LINE
-- =====================================================================
create table if not exists public.journal_balancer_tb (
  id                 bigint generated always as identity primary key,
  user_id            uuid     not null default auth.uid()
                              references public.user_tb (id) on delete cascade,
  journal_reference  text     not null check (length(btrim(journal_reference)) > 0),
  journal_date       date     not null default current_date,
  line_no            smallint not null check (line_no > 0),
  account            text     not null check (length(btrim(account)) > 0),
  account_type       text     not null
                              check (account_type in ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense')),
  description        text,
  debit_centavos     bigint   not null default 0 check (debit_centavos >= 0),
  credit_centavos    bigint   not null default 0 check (credit_centavos >= 0),
  created_at         timestamptz not null default now(),

  constraint journal_line_one_side
    check ((debit_centavos > 0) <> (credit_centavos > 0)),
  constraint journal_line_unique
    unique (user_id, journal_reference, line_no)
);

create index if not exists journal_balancer_tb_user_ref_idx
  on public.journal_balancer_tb (user_id, journal_reference);

create or replace view public.journal_balancer_summary
with (security_invoker = true) as
select
  user_id,
  journal_reference,
  min(journal_date)                               as journal_date,
  count(*)                                        as line_count,
  sum(debit_centavos)                             as total_debit_centavos,
  sum(credit_centavos)                            as total_credit_centavos,
  abs(sum(debit_centavos) - sum(credit_centavos)) as difference_centavos,
  (count(*) >= 2
     and sum(debit_centavos) = sum(credit_centavos)
     and sum(debit_centavos) > 0)                 as is_balanced
from public.journal_balancer_tb
group by user_id, journal_reference;


-- =====================================================================
-- 7) statement_check_tb  -- P&L and balance-sheet (A = L + E) check
-- =====================================================================
create table if not exists public.statement_check_tb (
  id                      bigint generated always as identity primary key,
  user_id                 uuid    not null default auth.uid()
                                  references public.user_tb (id) on delete cascade,
  statement_date          date    not null default current_date,

  revenue_centavos        bigint  not null default 0 check (revenue_centavos >= 0),
  expenses_centavos       bigint  not null default 0 check (expenses_centavos >= 0),
  assets_centavos         bigint  not null default 0 check (assets_centavos >= 0),
  liabilities_centavos    bigint  not null default 0 check (liabilities_centavos >= 0),
  equity_base_centavos    bigint  not null default 0 check (equity_base_centavos >= 0),

  link_profit_to_equity   boolean not null default true,
  manual_profit_centavos  bigint  check (manual_profit_centavos >= 0),

  net_profit_centavos     bigint generated always as (
                            revenue_centavos - expenses_centavos
                          ) stored,
  total_equity_centavos   bigint generated always as (
                            equity_base_centavos
                            + case when link_profit_to_equity
                                   then revenue_centavos - expenses_centavos
                                   else coalesce(manual_profit_centavos, 0) end
                          ) stored,
  difference_centavos     bigint generated always as (
                            abs(assets_centavos - (
                              liabilities_centavos + equity_base_centavos
                              + case when link_profit_to_equity
                                     then revenue_centavos - expenses_centavos
                                     else coalesce(manual_profit_centavos, 0) end))
                          ) stored,
  is_balanced             boolean generated always as (
                            assets_centavos > 0
                            and assets_centavos = liabilities_centavos + equity_base_centavos
                              + case when link_profit_to_equity
                                     then revenue_centavos - expenses_centavos
                                     else coalesce(manual_profit_centavos, 0) end
                          ) stored,

  created_at              timestamptz not null default now()
);

create index if not exists statement_check_tb_user_id_idx
  on public.statement_check_tb (user_id, statement_date desc);


-- =====================================================================
-- 8) aging_tb  -- one row per open receivable / payable
-- =====================================================================
create table if not exists public.aging_tb (
  id               bigint generated always as identity primary key,
  user_id          uuid   not null default auth.uid()
                          references public.user_tb (id) on delete cascade,
  schedule_type    text   not null check (schedule_type in ('receivables', 'payables')),
  as_of_date       date   not null default current_date,
  party_name       text   not null default 'Unassigned Contact',
  due_date         date   not null,
  amount_centavos  bigint not null check (amount_centavos >= 0),

  days_overdue     integer generated always as (
                     greatest(as_of_date - due_date, 0)
                   ) stored,
  bucket           text generated always as (
                     case
                       when due_date >= as_of_date      then 'current'
                       when as_of_date - due_date <= 30 then 'days_1_30'
                       when as_of_date - due_date <= 60 then 'days_31_60'
                       when as_of_date - due_date <= 90 then 'days_61_90'
                       else 'over_90'
                     end
                   ) stored,

  created_at       timestamptz not null default now()
);

create index if not exists aging_tb_user_schedule_idx
  on public.aging_tb (user_id, schedule_type, as_of_date);

create or replace view public.aging_summary
with (security_invoker = true) as
select
  user_id,
  schedule_type,
  as_of_date,
  count(*)                                                               as item_count,
  sum(amount_centavos)                                                   as total_outstanding_centavos,
  coalesce(sum(amount_centavos) filter (where bucket <> 'current'), 0)   as total_overdue_centavos,
  coalesce(sum(amount_centavos) filter (where bucket = 'current'), 0)    as current_centavos,
  coalesce(sum(amount_centavos) filter (where bucket = 'days_1_30'), 0)  as days_1_30_centavos,
  coalesce(sum(amount_centavos) filter (where bucket = 'days_31_60'), 0) as days_31_60_centavos,
  coalesce(sum(amount_centavos) filter (where bucket = 'days_61_90'), 0) as days_61_90_centavos,
  coalesce(sum(amount_centavos) filter (where bucket = 'over_90'), 0)    as over_90_centavos
from public.aging_tb
group by user_id, schedule_type, as_of_date;


-- =====================================================================
-- 9) Row Level Security
-- =====================================================================
alter table public.user_type_tb            enable row level security;
alter table public.permission_tb           enable row level security;
alter table public.user_type_permission_tb enable row level security;
alter table public.user_tb                 enable row level security;
alter table public.activity_log_tb         enable row level security;
alter table public.vat_tb                  enable row level security;
alter table public.payment_tb              enable row level security;
alter table public.journal_balancer_tb     enable row level security;
alter table public.statement_check_tb      enable row level security;
alter table public.aging_tb                enable row level security;

-- Nothing is visible to signed-out visitors
revoke all on public.user_type_tb, public.permission_tb, public.user_type_permission_tb,
              public.user_tb, public.activity_log_tb, public.vat_tb, public.payment_tb,
              public.journal_balancer_tb, public.statement_check_tb, public.aging_tb,
              public.journal_balancer_summary, public.aging_summary
  from anon;

-- RBAC tables: readable by signed-in users (the app needs its own permissions),
-- editable only from the Supabase dashboard / SQL editor
revoke insert, update, delete on public.user_type_tb, public.permission_tb,
                                 public.user_type_permission_tb from authenticated;

drop policy if exists "rbac: read user types"       on public.user_type_tb;
drop policy if exists "rbac: read permissions"      on public.permission_tb;
drop policy if exists "rbac: read role permissions" on public.user_type_permission_tb;
create policy "rbac: read user types"       on public.user_type_tb            for select to authenticated using (true);
create policy "rbac: read permissions"      on public.permission_tb           for select to authenticated using (true);
create policy "rbac: read role permissions" on public.user_type_permission_tb for select to authenticated using (true);

-- user_tb: see your own profile; admins (clients.view) see everyone.
-- Profiles are created only by the sign-up trigger, never deleted from the app.
revoke insert, update, delete on public.user_tb from authenticated;
grant update (full_name, email, company_name, avatar_initials, user_type, is_active, username)
  on public.user_tb to authenticated;  -- column changes are policed by protect_user_tb()

drop policy if exists "user_tb: read own profile"   on public.user_tb;
drop policy if exists "user_tb: update own profile" on public.user_tb;
drop policy if exists "user_tb: read"               on public.user_tb;
drop policy if exists "user_tb: update"             on public.user_tb;

create policy "user_tb: read" on public.user_tb
  for select to authenticated
  using ((select auth.uid()) = id or (select public.has_permission('clients.view')));

create policy "user_tb: update" on public.user_tb
  for update to authenticated
  using (
    ((select auth.uid()) = id and (select public.has_permission('profile.update_own')))
    or (select public.has_permission('clients.manage'))
  )
  with check (
    ((select auth.uid()) = id and (select public.has_permission('profile.update_own')))
    or (select public.has_permission('clients.manage'))
  );

-- activity_log_tb: everyone writes their own entries; only admins read all.
-- Entries can never be edited or deleted from the app (audit trail).
revoke update, delete on public.activity_log_tb from authenticated;

drop policy if exists "activity_log_tb: insert own" on public.activity_log_tb;
drop policy if exists "activity_log_tb: read"       on public.activity_log_tb;

create policy "activity_log_tb: insert own" on public.activity_log_tb
  for insert to authenticated
  with check ((select auth.uid()) = user_id and (select public.has_permission('activity.log_own')));

create policy "activity_log_tb: read" on public.activity_log_tb
  for select to authenticated
  using ((select auth.uid()) = user_id or (select public.has_permission('activity.view_all')));

-- Calculation tables: own rows (calculation.save); admins can read all
do $$
declare
  t text;
begin
  foreach t in array array['vat_tb', 'payment_tb', 'journal_balancer_tb',
                           'statement_check_tb', 'aging_tb']
  loop
    execute format('drop policy if exists "%1$s: own rows" on public.%1$I', t);
    execute format('drop policy if exists "%1$s: read"     on public.%1$I', t);
    execute format('drop policy if exists "%1$s: insert"   on public.%1$I', t);
    execute format('drop policy if exists "%1$s: update"   on public.%1$I', t);
    execute format('drop policy if exists "%1$s: delete"   on public.%1$I', t);

    execute format(
      'create policy "%1$s: read" on public.%1$I for select to authenticated
         using ((select auth.uid()) = user_id
                or (select public.has_permission(''calculation.view_all'')))', t);
    execute format(
      'create policy "%1$s: insert" on public.%1$I for insert to authenticated
         with check ((select auth.uid()) = user_id
                     and (select public.has_permission(''calculation.save'')))', t);
    execute format(
      'create policy "%1$s: update" on public.%1$I for update to authenticated
         using ((select auth.uid()) = user_id
                and (select public.has_permission(''calculation.save'')))
         with check ((select auth.uid()) = user_id)', t);
    execute format(
      'create policy "%1$s: delete" on public.%1$I for delete to authenticated
         using ((select auth.uid()) = user_id
                and (select public.has_permission(''calculation.save'')))', t);
  end loop;
end;
$$;


-- =====================================================================
-- 10) Seed accounts
--     Kamteam        / Numbers2020  -> admin
--     Sample Client  / Numbers2020  -> client
--     Change these passwords after the first sign-in
--     (Supabase Dashboard -> Authentication -> Users).
--     Their contact email is left empty; set it later with e.g.
--       update public.user_tb set email = 'you@example.com' where username = 'Kamteam';
-- =====================================================================
do $$
declare
  rec   record;
  v_id  uuid;
  v_em  text;
begin
  for rec in
    select * from (values
      ('Kamteam',       'Admin',         'admin',  'KAMTEAM'),
      ('Sample Client', 'Sample Client', 'client', 'Sample Client Company')
    ) as t(username, full_name, user_type, company_name)
  loop
    v_em := public.username_to_email(rec.username);
    select id into v_id from auth.users where email = v_em;

    if v_id is null then
      v_id := gen_random_uuid();

      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change
      ) values (
        '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
        v_em, extensions.crypt('Numbers2020', extensions.gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('username', rec.username,
                           'full_name', rec.full_name,
                           'company_name', rec.company_name),
        now(), now(), '', '', '', ''
      );

      insert into auth.identities (
        id, user_id, provider_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), v_id, v_id::text,
        jsonb_build_object('sub', v_id::text, 'email', v_em, 'email_verified', true),
        'email', now(), now(), now()
      );
    end if;

    -- The sign-up trigger creates every profile as 'client'; set the real type
    update public.user_tb
       set user_type = rec.user_type
     where id = v_id;
  end loop;
end;
$$;
