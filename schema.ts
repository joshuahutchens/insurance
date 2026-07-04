import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const tenants = pgTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  plan: text("plan").default("professional").notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("tenants_slug_idx").on(table.slug)]);

export const agencies = pgTable("agencies", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  timezone: text("timezone").default("America/Denver").notNull(),
  renewalWindowDays: integer("renewal_window_days").default(120).notNull(),
  settings: jsonb("settings").$type<Record<string, unknown>>().default({}).notNull(),
  ...timestamps,
}, (table) => [index("agencies_tenant_idx").on(table.tenantId)]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  agencyId: text("agency_id").references(() => agencies.id).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(),
  active: boolean("active").default(true).notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex("users_tenant_email_idx").on(table.tenantId, table.email),
  index("users_agency_idx").on(table.agencyId),
]);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("sessions_token_idx").on(table.tokenHash)]);

export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  agencyId: text("agency_id").references(() => agencies.id).notNull(),
  company: text("company").notNull(),
  contact: text("contact").notNull(),
  email: text("email").default("").notNull(),
  phone: text("phone").default("").notNull(),
  address: text("address").default("").notNull(),
  city: text("city").default("").notNull(),
  state: text("state").default("").notNull(),
  status: text("status").notNull(),
  source: text("source").default("Manual").notNull(),
  assignedAgent: text("assigned_agent").default("Unassigned").notNull(),
  csr: text("csr").default("Unassigned").notNull(),
  healthScore: integer("health_score").default(50).notNull(),
  estimatedPremium: numeric("estimated_premium", { precision: 14, scale: 2 }).default("0").notNull(),
  renewalDate: text("renewal_date").notNull(),
  industry: text("industry").default("Unclassified").notNull(),
  tags: jsonb("tags").$type<string[]>().default([]).notNull(),
  lastContact: timestamp("last_contact", { withTimezone: true }).defaultNow().notNull(),
  ...timestamps,
}, (table) => [
  index("customers_tenant_idx").on(table.tenantId),
  index("customers_agency_status_idx").on(table.agencyId, table.status),
]);

export const policies = pgTable("policies", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  customerId: text("customer_id").references(() => customers.id).notNull(),
  type: text("type").notNull(),
  carrier: text("carrier").notNull(),
  policyNumber: text("policy_number").notNull(),
  premium: numeric("premium", { precision: 14, scale: 2 }).default("0").notNull(),
  deductible: numeric("deductible", { precision: 14, scale: 2 }).default("0").notNull(),
  effective: text("effective").notNull(),
  expiration: text("expiration").notNull(),
  status: text("status").notNull(),
  ...timestamps,
}, (table) => [
  index("policies_tenant_idx").on(table.tenantId),
  index("policies_customer_idx").on(table.customerId),
]);

export const claims = pgTable("claims", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  customerId: text("customer_id").references(() => customers.id).notNull(),
  number: text("number").notNull(),
  type: text("type").notNull(),
  carrier: text("carrier").notNull(),
  status: text("status").notNull(),
  dateOfLoss: text("date_of_loss").notNull(),
  adjuster: text("adjuster").default("").notNull(),
  reserve: numeric("reserve", { precision: 14, scale: 2 }).default("0").notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex("claims_tenant_number_idx").on(table.tenantId, table.number),
  index("claims_customer_idx").on(table.customerId),
]);

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  customerId: text("customer_id").references(() => customers.id).notNull(),
  title: text("title").notNull(),
  due: text("due").notNull(),
  priority: text("priority").default("Medium").notNull(),
  assignee: text("assignee").notNull(),
  completed: boolean("completed").default(false).notNull(),
  ...timestamps,
}, (table) => [
  index("tasks_tenant_idx").on(table.tenantId),
  index("tasks_customer_idx").on(table.customerId),
]);

export const communications = pgTable("communications", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  customerId: text("customer_id").references(() => customers.id).notNull(),
  channel: text("channel").notNull(),
  direction: text("direction").notNull(),
  author: text("author").notNull(),
  body: text("body").notNull(),
  unread: boolean("unread").default(false).notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("communications_tenant_idx").on(table.tenantId),
  index("communications_customer_idx").on(table.customerId),
]);

export const timelineEvents = pgTable("timeline_events", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  customerId: text("customer_id").references(() => customers.id).notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  detail: text("detail").default("").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("timeline_tenant_idx").on(table.tenantId),
  index("timeline_customer_idx").on(table.customerId),
]);

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  actorId: text("actor_id").references(() => users.id).notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("audit_tenant_idx").on(table.tenantId),
  index("audit_entity_idx").on(table.entityType, table.entityId),
]);
