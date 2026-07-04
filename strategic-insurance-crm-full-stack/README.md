# Strategic Insurance CRM

A polished, responsive CRM with a persistent local API and PostgreSQL-compatible
data layer, synthesized from all 12 Strategic Insurance CRM build packages.

## What is implemented

- Demo authentication and responsive agency shell
- Daily command-center dashboard
- Searchable customer lifecycle and customer creation
- Customer 360 workspace with communications, policies, claims, documents,
  tasks, timeline, and AI guidance
- Unified communication inbox
- Interactive sample policy-analysis workflow
- AI discovery opportunity queue
- Claims and renewal servicing views
- Automation sequence library
- Agency snapshot plus all 12 report routes
- Agency, team, security, carrier, branding, integration, and website settings
- Tenant-scoped Express API with validation, session authentication, duplicate
  checks, timeline automation, and audit logging
- Durable PGlite database using Drizzle's PostgreSQL schema

The app seeds realistic agency data into an embedded PostgreSQL-compatible
database under `.data/`. Creating a customer, completing a task, adding a task,
and sending or logging a communication persist through the API. Important
mutations automatically produce timeline or audit records.

## Run locally

Requirements: Node.js 20+ and pnpm.

```bash
pnpm install
pnpm dev:full
```

Then open `http://localhost:4173`.

Production validation:

```bash
pnpm typecheck
pnpm build
pnpm preview
```

## Deliberate boundary

This delivery includes local persistence, session authentication, tenant-scoped
queries, audit logging, and core CRM mutations. External services are represented
by production-shaped UI flows but are not yet connected: object storage,
OCR/OpenAI, Twilio, Resend, e-signature, Stripe billing, and live report
aggregation. PGlite should be replaced with hosted PostgreSQL for production;
the Drizzle schema and query model are already PostgreSQL-native.

Those integrations should be implemented behind the existing customer-centered
model so every business record remains agency-scoped and customer-linked. AI
actions must remain advisory, logged, and explicitly confirmed by a user.
