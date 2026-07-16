import { pgTable, text, timestamp, uuid, numeric, date, time, boolean, integer, jsonb, primaryKey } from 'drizzle-orm/pg-core';

// ─── Profiles ──────────────────────────────────────────────────────
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  displayName: text('display_name').notNull(),
  timezone: text('timezone').notNull().default('America/Sao_Paulo'),
  locale: text('locale').notNull().default('pt-BR'),
  onboardingStatus: text('onboarding_status').notNull().default('not_started'),
  birthAdultConfirmedAt: timestamp('birth_adult_confirmed_at'),
  heightCm: numeric('height_cm', { precision: 4, scale: 1 }),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Consent Records ───────────────────────────────────────────────
export const consentRecords = pgTable('consent_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  consentType: text('consent_type').notNull(),
  version: text('version').notNull(),
  granted: boolean('granted').notNull(),
  source: text('source').notNull(),
  ipHash: text('ip_hash'),
  userAgentHash: text('user_agent_hash'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── User Goals ────────────────────────────────────────────────────
export const userGoals = pgTable('user_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  targetWeightKg: numeric('target_weight_kg', { precision: 5, scale: 1 }),
  motivation: text('motivation'),
  startDate: timestamp('start_date').notNull().defaultNow(),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Weight Entries ────────────────────────────────────────────────
export const weightEntries = pgTable('weight_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  weightKg: numeric('weight_kg', { precision: 5, scale: 1 }).notNull(),
  measuredAt: timestamp('measured_at').notNull(),
  source: text('source').notNull().default('manual'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Measurement Entries ───────────────────────────────────────────
export const measurementEntries = pgTable('measurement_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  measurementType: text('measurement_type').notNull(),
  valueCm: numeric('value_cm', { precision: 5, scale: 1 }).notNull(),
  customLabel: text('custom_label'),
  measuredAt: timestamp('measured_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Daily Check-ins ───────────────────────────────────────────────
export const dailyCheckins = pgTable('daily_checkins', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  checkinDate: date('checkin_date').notNull(),
  hungerLevel: integer('hunger_level'),
  energyLevel: integer('energy_level'),
  sleepQuality: integer('sleep_quality'),
  activityLevel: text('activity_level'),
  waterMl: integer('water_ml'),
  encryptedNote: text('encrypted_note'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Symptom Catalog ───────────────────────────────────────────────
export const symptomCatalog = pgTable('symptom_catalog', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  labelPt: text('label_pt').notNull(),
  active: boolean('active').notNull().default(true),
  clinicalReviewVersion: text('clinical_review_version'),
  sortOrder: integer('sort_order'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Check-in Symptoms (join) ──────────────────────────────────────
export const checkinSymptoms = pgTable('checkin_symptoms', {
  checkinId: uuid('checkin_id').notNull().references(() => dailyCheckins.id, { onDelete: 'cascade' }),
  symptomId: uuid('symptom_id').notNull().references(() => symptomCatalog.id),
  intensity: text('intensity'),
}, (t) => [primaryKey({ columns: [t.checkinId, t.symptomId] })]);

// ─── Routine Plans ─────────────────────────────────────────────────
export const routinePlans = pgTable('routine_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  userEnteredName: text('user_entered_name').notNull(),
  doseValue: numeric('dose_value', { precision: 10, scale: 2 }),
  doseUnit: text('dose_unit'),
  recurrenceRule: text('recurrence_rule'),
  startAt: timestamp('start_at').notNull(),
  endAt: timestamp('end_at'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Routine Events ────────────────────────────────────────────────
export const routineEvents = pgTable('routine_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  planId: uuid('plan_id').notNull().references(() => routinePlans.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  scheduledAt: timestamp('scheduled_at').notNull(),
  status: text('status').notNull().default('pending'),
  completedAt: timestamp('completed_at'),
  encryptedNote: text('encrypted_note'),
  rescheduledFromId: uuid('rescheduled_from_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Appointments ──────────────────────────────────────────────────
export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  startsAt: timestamp('starts_at').notNull(),
  professionalName: text('professional_name'),
  locationType: text('location_type'),
  encryptedLocation: text('encrypted_location'),
  encryptedNote: text('encrypted_note'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Notification Preferences ──────────────────────────────────────
export const notificationPreferences = pgTable('notification_preferences', {
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  channel: text('channel').notNull(),
  type: text('type').notNull(),
  enabled: boolean('enabled').notNull().default(false),
  localTime: time('local_time'),
  quietDays: text('quiet_days').array(),
  timezone: text('timezone').notNull().default('America/Sao_Paulo'),
  consentRecordId: uuid('consent_record_id').references(() => consentRecords.id),
}, (t) => [primaryKey({ columns: [t.userId, t.channel, t.type] })]);

// ─── Notification Jobs ─────────────────────────────────────────────
export const notificationJobs = pgTable('notification_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  relatedId: text('related_id'),
  scheduledAt: timestamp('scheduled_at').notNull(),
  channel: text('channel').notNull(),
  templateKey: text('template_key').notNull(),
  status: text('status').notNull().default('pending'),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Notification Deliveries ───────────────────────────────────────
export const notificationDeliveries = pgTable('notification_deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().references(() => notificationJobs.id, { onDelete: 'cascade' }),
  providerMessageId: text('provider_message_id'),
  status: text('status').notNull(),
  providerErrorCode: text('provider_error_code'),
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Report Jobs ───────────────────────────────────────────────────
export const reportJobs = pgTable('report_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  sectionsJson: jsonb('sections_json').notNull().default([]),
  status: text('status').notNull().default('pending'),
  storagePath: text('storage_path'),
  expiresAt: timestamp('expires_at'),
  checksum: text('checksum'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Subscriptions ─────────────────────────────────────────────────
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull().default('efi'),
  providerSubscriptionId: text('provider_subscription_id').notNull().unique(),
  planCode: text('plan_code').notNull(),
  status: text('status').notNull().default('trialing'),
  trialEndsAt: timestamp('trial_ends_at'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Payment Events ────────────────────────────────────────────────
export const paymentEvents = pgTable('payment_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerEventId: text('provider_event_id').notNull().unique(),
  eventType: text('event_type').notNull(),
  signatureValid: boolean('signature_valid').notNull(),
  payloadHash: text('payload_hash').notNull(),
  processedAt: timestamp('processed_at'),
  outcome: text('outcome'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Audit Events ──────────────────────────────────────────────────
export const auditEvents = pgTable('audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorUserId: uuid('actor_user_id'),
  adminId: uuid('admin_id'),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id'),
  reasonCode: text('reason_code'),
  metadataRedacted: jsonb('metadata_redacted'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Privacy Requests ──────────────────────────────────────────────
export const privacyRequests = pgTable('privacy_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  requestType: text('request_type').notNull(),
  status: text('status').notNull().default('pending'),
  requestedAt: timestamp('requested_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  resultPath: text('result_path'),
  expiresAt: timestamp('expires_at'),
});

// ─── Admin Users ───────────────────────────────────────────────────
export const adminUsers = pgTable('admin_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  authUserId: uuid('auth_user_id').notNull().unique(),
  role: text('role').notNull().default('support_l1'),
  active: boolean('active').notNull().default(true),
  mfaRequired: boolean('mfa_required').notNull().default(true),
  lastAccessAt: timestamp('last_access_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
