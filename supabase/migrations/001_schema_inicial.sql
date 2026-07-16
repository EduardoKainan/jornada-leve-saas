-- Jornada Leve — Migration 001: Schema inicial + RLS
-- Modelo de dados baseado no PRD v2.0, Seção 10

-- Extensions
create extension if not exists "pgcrypto";

-- Profiles
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  timezone text not null default 'America/Sao_Paulo',
  locale text not null default 'pt-BR',
  onboarding_status text not null default 'not_started'
    check (onboarding_status in ('not_started', 'in_progress', 'completed')),
  birth_adult_confirmed_at timestamptz,
  height_cm numeric(4,1),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Consent records
create table if not exists consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  consent_type text not null,
  version text not null,
  granted boolean not null,
  source text not null,
  ip_hash text,
  user_agent_hash text,
  created_at timestamptz not null default now()
);

-- User goals
create table if not exists user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  target_weight_kg numeric(5,1),
  motivation text,
  start_date timestamptz not null default now(),
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

-- Weight entries
create table if not exists weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  weight_kg numeric(5,1) not null,
  measured_at timestamptz not null,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Measurement entries
create table if not exists measurement_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  measurement_type text not null,
  value_cm numeric(5,1) not null,
  custom_label text,
  measured_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Daily check-ins
create table if not exists daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  checkin_date date not null,
  hunger_level integer check (hunger_level between 1 and 5),
  energy_level integer check (energy_level between 1 and 5),
  sleep_quality integer check (sleep_quality between 1 and 5),
  activity_level text check (activity_level in ('nenhuma', 'leve', 'moderada', 'intensa')),
  water_ml integer,
  encrypted_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, checkin_date)
);

-- Symptom catalog (controlled list)
create table if not exists symptom_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label_pt text not null,
  active boolean not null default true,
  clinical_review_version text,
  sort_order integer,
  created_at timestamptz not null default now()
);

-- Check-in symptoms (join table)
create table if not exists checkin_symptoms (
  checkin_id uuid not null references daily_checkins(id) on delete cascade,
  symptom_id uuid not null references symptom_catalog(id),
  intensity text,
  primary key (checkin_id, symptom_id)
);

-- Routine plans
create table if not exists routine_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  user_entered_name text not null,
  dose_value numeric(10,2),
  dose_unit text,
  recurrence_rule text,
  start_at timestamptz not null,
  end_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Routine events (individual occurrences)
create table if not exists routine_events (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references routine_plans(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  scheduled_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'skipped', 'rescheduled', 'cancelled')),
  completed_at timestamptz,
  encrypted_note text,
  rescheduled_from_id uuid references routine_events(id),
  created_at timestamptz not null default now()
);

-- Appointments
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  starts_at timestamptz not null,
  professional_name text,
  location_type text,
  encrypted_location text,
  encrypted_note text,
  created_at timestamptz not null default now()
);

-- Notification preferences
create table if not exists notification_preferences (
  user_id uuid not null references profiles(id) on delete cascade,
  channel text not null,
  type text not null,
  enabled boolean not null default false,
  local_time time,
  quiet_days text[],
  timezone text not null default 'America/Sao_Paulo',
  consent_record_id uuid references consent_records(id),
  primary key (user_id, channel, type)
);

-- Notification jobs (logical queue)
create table if not exists notification_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  event_type text not null,
  related_id text,
  scheduled_at timestamptz not null,
  channel text not null,
  template_key text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'sent', 'failed', 'skipped')),
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

-- Notification deliveries
create table if not exists notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references notification_jobs(id) on delete cascade,
  provider_message_id text,
  status text not null,
  provider_error_code text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Report jobs
create table if not exists report_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  sections_json jsonb not null default '[]',
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'ready', 'failed')),
  storage_path text,
  expires_at timestamptz,
  checksum text,
  created_at timestamptz not null default now()
);

-- Subscriptions
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  provider text not null default 'efi',
  provider_subscription_id text not null unique,
  plan_code text not null,
  status text not null default 'trialing'
    check (status in ('trialing', 'active', 'past_due', 'canceled', 'expired', 'grace_period', 'canceled_end_of_period')),
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Payment events (webhook audit)
create table if not exists payment_events (
  id uuid primary key default gen_random_uuid(),
  provider_event_id text not null unique,
  event_type text not null,
  signature_valid boolean not null,
  payload_hash text not null,
  processed_at timestamptz,
  outcome text,
  created_at timestamptz not null default now()
);

-- Audit events
create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  admin_id uuid,
  action text not null,
  resource_type text not null,
  resource_id text,
  reason_code text,
  metadata_redacted jsonb,
  created_at timestamptz not null default now()
);

-- Privacy requests
create table if not exists privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  request_type text not null check (request_type in ('export', 'delete', 'rectify')),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  result_path text,
  expires_at timestamptz
);

-- Admin users
create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  role text not null default 'support_l1'
    check (role in ('support_l1', 'support_l2', 'privacy_operator', 'content_reviewer', 'security_admin', 'super_admin')),
  active boolean not null default true,
  mfa_required boolean not null default true,
  last_access_at timestamptz,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_weight_entries_user_measured
  on weight_entries(user_id, measured_at desc);
create index if not exists idx_measurement_entries_user_measured
  on measurement_entries(user_id, measured_at desc);
create index if not exists idx_daily_checkins_user_date
  on daily_checkins(user_id, checkin_date desc);
create index if not exists idx_routine_events_user_scheduled
  on routine_events(user_id, scheduled_at);
create index if not exists idx_routine_events_status_scheduled
  on routine_events(status, scheduled_at);
create index if not exists idx_notification_jobs_status_scheduled
  on notification_jobs(status, scheduled_at);
create index if not exists idx_report_jobs_user_status
  on report_jobs(user_id, status);
create index if not exists idx_subscriptions_user
  on subscriptions(user_id);
create index if not exists idx_privacy_requests_user
  on privacy_requests(user_id);

-- Row Level Security
alter table profiles enable row level security;
alter table consent_records enable row level security;
alter table user_goals enable row level security;
alter table weight_entries enable row level security;
alter table measurement_entries enable row level security;
alter table daily_checkins enable row level security;
alter table checkin_symptoms enable row level security;
alter table routine_plans enable row level security;
alter table routine_events enable row level security;
alter table appointments enable row level security;
alter table notification_preferences enable row level security;
alter table notification_jobs enable row level security;
alter table report_jobs enable row level security;
alter table subscriptions enable row level security;
alter table privacy_requests enable row level security;

-- RLS Policies: user can only access own data
create policy "Users can manage own profile"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can manage own consent records"
  on consent_records for all
  using (auth.uid() = user_id);

create policy "Users can manage own goals"
  on user_goals for all
  using (auth.uid() = user_id);

create policy "Users can manage own weight entries"
  on weight_entries for all
  using (auth.uid() = user_id);

create policy "Users can manage own measurements"
  on measurement_entries for all
  using (auth.uid() = user_id);

create policy "Users can manage own check-ins"
  on daily_checkins for all
  using (auth.uid() = user_id);

create policy "Users can manage own check-in symptoms"
  on checkin_symptoms for all
  using (
    exists (
      select 1 from daily_checkins
      where daily_checkins.id = checkin_symptoms.checkin_id
      and daily_checkins.user_id = auth.uid()
    )
  );

create policy "Users can manage own routine plans"
  on routine_plans for all
  using (auth.uid() = user_id);

create policy "Users can manage own routine events"
  on routine_events for all
  using (auth.uid() = user_id);

create policy "Users can manage own appointments"
  on appointments for all
  using (auth.uid() = user_id);

create policy "Users can manage own notification preferences"
  on notification_preferences for all
  using (auth.uid() = user_id);

create policy "Users can manage own report jobs"
  on report_jobs for all
  using (auth.uid() = user_id);

create policy "Users can view own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can manage own privacy requests"
  on privacy_requests for all
  using (auth.uid() = user_id);

-- Public read for symptom catalog
create policy "Symptom catalog public read"
  on symptom_catalog for select
  to authenticated
  using (active = true);

-- Service role policies for admin tables
create policy "Admin only audit events"
  on audit_events for all
  using (exists (select 1 from admin_users where auth_user_id = auth.uid()))
  with check (exists (select 1 from admin_users where auth_user_id = auth.uid()));

create policy "Admin only payment events"
  on payment_events for all
  using (exists (select 1 from admin_users where auth_user_id = auth.uid()))
  with check (exists (select 1 from admin_users where auth_user_id = auth.uid()));
