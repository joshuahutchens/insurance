import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema.js";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(here, "../.data/pglite");
await mkdir(dataDir, { recursive: true });

export const client = await PGlite.create(dataDir);
export const db = drizzle({ client, schema });

export async function migrate() {
  await client.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id text PRIMARY KEY,
      name text NOT NULL,
      slug text NOT NULL UNIQUE,
      plan text NOT NULL DEFAULT 'professional',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS agencies (
      id text PRIMARY KEY,
      tenant_id text NOT NULL REFERENCES tenants(id),
      name text NOT NULL,
      timezone text NOT NULL DEFAULT 'America/Denver',
      renewal_window_days integer NOT NULL DEFAULT 120,
      settings jsonb NOT NULL DEFAULT '{}',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY,
      tenant_id text NOT NULL REFERENCES tenants(id),
      agency_id text NOT NULL REFERENCES agencies(id),
      name text NOT NULL,
      email text NOT NULL,
      password_hash text NOT NULL,
      role text NOT NULL,
      active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (tenant_id, email)
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id text PRIMARY KEY,
      tenant_id text NOT NULL REFERENCES tenants(id),
      user_id text NOT NULL REFERENCES users(id),
      token_hash text NOT NULL UNIQUE,
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS customers (
      id text PRIMARY KEY,
      tenant_id text NOT NULL REFERENCES tenants(id),
      agency_id text NOT NULL REFERENCES agencies(id),
      company text NOT NULL,
      contact text NOT NULL,
      email text NOT NULL DEFAULT '',
      phone text NOT NULL DEFAULT '',
      address text NOT NULL DEFAULT '',
      city text NOT NULL DEFAULT '',
      state text NOT NULL DEFAULT '',
      status text NOT NULL,
      source text NOT NULL DEFAULT 'Manual',
      assigned_agent text NOT NULL DEFAULT 'Unassigned',
      csr text NOT NULL DEFAULT 'Unassigned',
      health_score integer NOT NULL DEFAULT 50,
      estimated_premium numeric(14,2) NOT NULL DEFAULT 0,
      renewal_date text NOT NULL,
      industry text NOT NULL DEFAULT 'Unclassified',
      tags jsonb NOT NULL DEFAULT '[]',
      last_contact timestamptz NOT NULL DEFAULT now(),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS policies (
      id text PRIMARY KEY,
      tenant_id text NOT NULL REFERENCES tenants(id),
      customer_id text NOT NULL REFERENCES customers(id),
      type text NOT NULL,
      carrier text NOT NULL,
      policy_number text NOT NULL,
      premium numeric(14,2) NOT NULL DEFAULT 0,
      deductible numeric(14,2) NOT NULL DEFAULT 0,
      effective text NOT NULL,
      expiration text NOT NULL,
      status text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS claims (
      id text PRIMARY KEY,
      tenant_id text NOT NULL REFERENCES tenants(id),
      customer_id text NOT NULL REFERENCES customers(id),
      number text NOT NULL,
      type text NOT NULL,
      carrier text NOT NULL,
      status text NOT NULL,
      date_of_loss text NOT NULL,
      adjuster text NOT NULL DEFAULT '',
      reserve numeric(14,2) NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (tenant_id, number)
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id text PRIMARY KEY,
      tenant_id text NOT NULL REFERENCES tenants(id),
      customer_id text NOT NULL REFERENCES customers(id),
      title text NOT NULL,
      due text NOT NULL,
      priority text NOT NULL DEFAULT 'Medium',
      assignee text NOT NULL,
      completed boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS communications (
      id text PRIMARY KEY,
      tenant_id text NOT NULL REFERENCES tenants(id),
      customer_id text NOT NULL REFERENCES customers(id),
      channel text NOT NULL,
      direction text NOT NULL,
      author text NOT NULL,
      body text NOT NULL,
      unread boolean NOT NULL DEFAULT false,
      occurred_at timestamptz NOT NULL DEFAULT now(),
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS timeline_events (
      id text PRIMARY KEY,
      tenant_id text NOT NULL REFERENCES tenants(id),
      customer_id text NOT NULL REFERENCES customers(id),
      type text NOT NULL,
      title text NOT NULL,
      detail text NOT NULL DEFAULT '',
      occurred_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id text PRIMARY KEY,
      tenant_id text NOT NULL REFERENCES tenants(id),
      actor_id text NOT NULL REFERENCES users(id),
      action text NOT NULL,
      entity_type text NOT NULL,
      entity_id text NOT NULL,
      metadata jsonb NOT NULL DEFAULT '{}',
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS customers_tenant_idx ON customers(tenant_id);
    CREATE INDEX IF NOT EXISTS customers_agency_status_idx ON customers(agency_id, status);
    CREATE INDEX IF NOT EXISTS policies_customer_idx ON policies(customer_id);
    CREATE INDEX IF NOT EXISTS claims_customer_idx ON claims(customer_id);
    CREATE INDEX IF NOT EXISTS tasks_customer_idx ON tasks(customer_id);
    CREATE INDEX IF NOT EXISTS communications_customer_idx ON communications(customer_id);
    CREATE INDEX IF NOT EXISTS timeline_customer_idx ON timeline_events(customer_id);
    CREATE INDEX IF NOT EXISTS audit_entity_idx ON audit_logs(entity_type, entity_id);
  `);
}
