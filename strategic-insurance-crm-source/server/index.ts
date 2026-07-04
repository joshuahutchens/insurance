import { randomUUID } from "node:crypto";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { and, asc, desc, eq, gt, ilike, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { db, migrate } from "./db.js";
import {
  auditLogs,
  claims,
  communications,
  customers,
  policies,
  sessions,
  tasks,
  timelineEvents,
  users,
} from "./schema.js";
import { DEMO_AGENCY_ID, DEMO_TENANT_ID, seedDatabase } from "./seed.js";
import { hashToken, issueToken, verifyPassword } from "./security.js";

await migrate();
await seedDatabase();

type Auth = {
  userId: string;
  tenantId: string;
  agencyId: string;
  name: string;
  role: string;
};
type AuthRequest = Request & { auth: Auth };

const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: ["http://localhost:4173"], credentials: false }));
app.use(express.json({ limit: "2mb" }));

const lifecycle = z.enum([
  "Opportunity", "Lead", "Application", "Quoted", "Submitted",
  "Bound", "Current", "Renewal", "Lost", "Archived",
]);
const priority = z.enum(["Low", "Medium", "High", "Urgent"]);
const channel = z.enum(["Email", "SMS", "Call", "Note", "Meeting"]);

function asyncRoute(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res, next).catch(next);
  };
}

async function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const rows = await db
    .select({
      userId: users.id,
      tenantId: users.tenantId,
      agencyId: users.agencyId,
      name: users.name,
      role: users.role,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date()), eq(users.active, true)))
    .limit(1);
  if (!rows.length) {
    res.status(401).json({ error: "Session expired" });
    return;
  }
  (req as AuthRequest).auth = rows[0];
  next();
}

function publicCustomer(row: typeof customers.$inferSelect, customerPolicies: Array<typeof policies.$inferSelect> = []) {
  return {
    ...row,
    estimatedPremium: Number(row.estimatedPremium),
    lastContact: row.lastContact.toISOString(),
    policies: customerPolicies.map((policy) => ({
      ...policy,
      premium: Number(policy.premium),
      deductible: Number(policy.deductible),
    })),
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "strategic-api", database: "ready", timestamp: new Date().toISOString() });
});

app.post("/api/auth/login", asyncRoute(async (req, res) => {
  const body = z.object({
    email: z.string().email().transform((value) => value.toLowerCase()),
    password: z.string().min(8),
  }).parse(req.body);
  const matches = await db
    .select()
    .from(users)
    .where(and(eq(users.tenantId, DEMO_TENANT_ID), eq(users.email, body.email), eq(users.active, true)))
    .limit(1);
  const user = matches[0];
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const token = issueToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12);
  await db.insert(sessions).values({
    id: randomUUID(),
    tenantId: user.tenantId,
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt,
  });
  await db.insert(auditLogs).values({
    id: randomUUID(),
    tenantId: user.tenantId,
    actorId: user.id,
    action: "session.created",
    entityType: "user",
    entityId: user.id,
  });
  res.json({
    token,
    expiresAt: expiresAt.toISOString(),
    user: { id: user.id, name: user.name, email: user.email, role: user.role, agencyId: user.agencyId },
  });
}));

app.use("/api", authenticate);

app.get("/api/auth/me", asyncRoute(async (req, res) => {
  const auth = (req as AuthRequest).auth;
  res.json({ user: auth });
}));

app.get("/api/dashboard", asyncRoute(async (req, res) => {
  const auth = (req as AuthRequest).auth;
  const [customerRows, taskRows, communicationRows, claimRows] = await Promise.all([
    db.select().from(customers).where(eq(customers.tenantId, auth.tenantId)),
    db.select().from(tasks).where(eq(tasks.tenantId, auth.tenantId)).orderBy(asc(tasks.due)),
    db.select().from(communications).where(eq(communications.tenantId, auth.tenantId)).orderBy(desc(communications.occurredAt)).limit(10),
    db.select().from(claims).where(eq(claims.tenantId, auth.tenantId)),
  ]);
  res.json({
    metrics: {
      customers: customerRows.length,
      activePremium: customerRows.reduce((sum, row) => sum + Number(row.estimatedPremium), 0),
      openTasks: taskRows.filter((row) => !row.completed).length,
      overdueTasks: taskRows.filter((row) => !row.completed && row.due < "2026-07-03").length,
      unreadCommunications: communicationRows.filter((row) => row.unread).length,
      openClaims: claimRows.filter((row) => row.status !== "Closed").length,
    },
    tasks: taskRows,
    communications: communicationRows.map((row) => ({ ...row, timestamp: row.occurredAt.toISOString() })),
  });
}));

app.get("/api/customers", asyncRoute(async (req, res) => {
  const auth = (req as AuthRequest).auth;
  const query = z.object({
    q: z.string().trim().max(100).optional(),
    status: lifecycle.optional(),
  }).parse(req.query);
  const conditions = [eq(customers.tenantId, auth.tenantId), eq(customers.agencyId, auth.agencyId)];
  if (query.status) conditions.push(eq(customers.status, query.status));
  if (query.q) {
    const search = `%${query.q}%`;
    const searchCondition = or(ilike(customers.company, search), ilike(customers.contact, search), ilike(customers.email, search));
    if (searchCondition) conditions.push(searchCondition);
  }
  const rows = await db.select().from(customers).where(and(...conditions)).orderBy(asc(customers.company));
  const ids = rows.map((row) => row.id);
  const policyRows = ids.length
    ? await db.select().from(policies).where(and(eq(policies.tenantId, auth.tenantId), inArray(policies.customerId, ids)))
    : [];
  res.json({
    customers: rows.map((row) => publicCustomer(row, policyRows.filter((policy) => policy.customerId === row.id))),
  });
}));

app.post("/api/customers", asyncRoute(async (req, res) => {
  const auth = (req as AuthRequest).auth;
  const body = z.object({
    company: z.string().trim().min(2).max(160),
    contact: z.string().trim().min(2).max(120),
    email: z.string().email(),
    phone: z.string().trim().max(40).default(""),
    status: lifecycle.default("Lead"),
    source: z.string().trim().max(60).default("Manual"),
  }).parse(req.body);
  const duplicate = await db.select({ id: customers.id }).from(customers).where(and(
    eq(customers.tenantId, auth.tenantId),
    or(ilike(customers.company, body.company), eq(customers.email, body.email)),
  )).limit(1);
  if (duplicate.length) {
    res.status(409).json({ error: "A matching customer already exists", customerId: duplicate[0].id });
    return;
  }
  const id = randomUUID();
  const now = new Date();
  const inserted = await db.transaction(async (tx) => {
    const [customer] = await tx.insert(customers).values({
      id,
      tenantId: auth.tenantId,
      agencyId: auth.agencyId,
      company: body.company,
      contact: body.contact,
      email: body.email,
      phone: body.phone,
      status: body.status,
      source: body.source,
      assignedAgent: auth.name,
      csr: "Unassigned",
      renewalDate: "2027-01-01",
      lastContact: now,
    }).returning();
    await tx.insert(timelineEvents).values({
      id: randomUUID(),
      tenantId: auth.tenantId,
      customerId: id,
      type: "Customer",
      title: "Customer created",
      detail: `Created by ${auth.name}`,
      occurredAt: now,
    });
    await tx.insert(auditLogs).values({
      id: randomUUID(),
      tenantId: auth.tenantId,
      actorId: auth.userId,
      action: "customer.created",
      entityType: "customer",
      entityId: id,
      metadata: { source: body.source },
    });
    return customer;
  });
  res.status(201).json({ customer: publicCustomer(inserted) });
}));

app.get("/api/customers/:id", asyncRoute(async (req, res) => {
  const auth = (req as AuthRequest).auth;
  const id = z.string().uuid().or(z.string().regex(/^cus-\d+$/)).parse(req.params.id);
  const rows = await db.select().from(customers).where(and(eq(customers.id, id), eq(customers.tenantId, auth.tenantId))).limit(1);
  if (!rows.length) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  const [policyRows, taskRows, claimRows, communicationRows, eventRows] = await Promise.all([
    db.select().from(policies).where(and(eq(policies.tenantId, auth.tenantId), eq(policies.customerId, id))),
    db.select().from(tasks).where(and(eq(tasks.tenantId, auth.tenantId), eq(tasks.customerId, id))).orderBy(asc(tasks.due)),
    db.select().from(claims).where(and(eq(claims.tenantId, auth.tenantId), eq(claims.customerId, id))),
    db.select().from(communications).where(and(eq(communications.tenantId, auth.tenantId), eq(communications.customerId, id))).orderBy(desc(communications.occurredAt)),
    db.select().from(timelineEvents).where(and(eq(timelineEvents.tenantId, auth.tenantId), eq(timelineEvents.customerId, id))).orderBy(desc(timelineEvents.occurredAt)),
  ]);
  res.json({
    customer: publicCustomer(rows[0], policyRows),
    tasks: taskRows,
    claims: claimRows.map((row) => ({ ...row, reserve: Number(row.reserve), updatedAt: row.updatedAt.toISOString().slice(0, 10) })),
    communications: communicationRows.map((row) => ({ ...row, timestamp: row.occurredAt.toISOString() })),
    timeline: eventRows.map((row) => ({ ...row, timestamp: row.occurredAt.toISOString() })),
  });
}));

app.post("/api/customers/:id/tasks", asyncRoute(async (req, res) => {
  const auth = (req as AuthRequest).auth;
  const customerId = z.string().min(1).parse(req.params.id);
  const body = z.object({
    title: z.string().trim().min(2).max(240),
    due: z.string().date(),
    priority: priority.default("Medium"),
    assignee: z.string().trim().min(2).default(auth.name),
  }).parse(req.body);
  const [owner] = await db.select({ id: customers.id }).from(customers).where(and(eq(customers.id, customerId), eq(customers.tenantId, auth.tenantId))).limit(1);
  if (!owner) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  const id = randomUUID();
  const [task] = await db.transaction(async (tx) => {
    const inserted = await tx.insert(tasks).values({ id, tenantId: auth.tenantId, customerId, ...body }).returning();
    await tx.insert(timelineEvents).values({ id: randomUUID(), tenantId: auth.tenantId, customerId, type: "Task", title: body.title, detail: `Assigned to ${body.assignee}` });
    await tx.insert(auditLogs).values({ id: randomUUID(), tenantId: auth.tenantId, actorId: auth.userId, action: "task.created", entityType: "task", entityId: id });
    return inserted;
  });
  res.status(201).json({ task });
}));

app.patch("/api/tasks/:id", asyncRoute(async (req, res) => {
  const auth = (req as AuthRequest).auth;
  const id = z.string().min(1).parse(req.params.id);
  const body = z.object({ completed: z.boolean() }).parse(req.body);
  const rows = await db.update(tasks).set({ completed: body.completed, updatedAt: new Date() }).where(and(eq(tasks.id, id), eq(tasks.tenantId, auth.tenantId))).returning();
  if (!rows.length) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  await db.insert(auditLogs).values({ id: randomUUID(), tenantId: auth.tenantId, actorId: auth.userId, action: body.completed ? "task.completed" : "task.reopened", entityType: "task", entityId: id });
  res.json({ task: rows[0] });
}));

app.post("/api/customers/:id/communications", asyncRoute(async (req, res) => {
  const auth = (req as AuthRequest).auth;
  const customerId = z.string().min(1).parse(req.params.id);
  const body = z.object({
    channel,
    body: z.string().trim().min(1).max(10_000),
    direction: z.enum(["inbound", "outbound", "internal"]).optional(),
  }).parse(req.body);
  const [owner] = await db.select({ id: customers.id }).from(customers).where(and(eq(customers.id, customerId), eq(customers.tenantId, auth.tenantId))).limit(1);
  if (!owner) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  const id = randomUUID();
  const direction = body.direction ?? (body.channel === "Note" ? "internal" : "outbound");
  const occurredAt = new Date();
  const [communication] = await db.transaction(async (tx) => {
    const inserted = await tx.insert(communications).values({ id, tenantId: auth.tenantId, customerId, channel: body.channel, direction, author: auth.name, body: body.body, occurredAt }).returning();
    await tx.update(customers).set({ lastContact: occurredAt, updatedAt: occurredAt }).where(and(eq(customers.id, customerId), eq(customers.tenantId, auth.tenantId)));
    await tx.insert(timelineEvents).values({ id: randomUUID(), tenantId: auth.tenantId, customerId, type: "Communication", title: `${body.channel} ${direction === "internal" ? "note added" : "sent"}`, detail: body.body.slice(0, 180), occurredAt });
    await tx.insert(auditLogs).values({ id: randomUUID(), tenantId: auth.tenantId, actorId: auth.userId, action: "communication.created", entityType: "communication", entityId: id, metadata: { channel: body.channel } });
    return inserted;
  });
  res.status(201).json({ communication: { ...communication, timestamp: communication.occurredAt.toISOString() } });
}));

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof z.ZodError) {
    res.status(400).json({ error: "Validation failed", issues: error.issues });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "Unexpected server error" });
});

const port = Number(process.env.PORT ?? 4174);
app.listen(port, () => {
  console.log(`Strategic API listening on http://localhost:${port}`);
  console.log(`Tenant isolation active for agency ${DEMO_AGENCY_ID}`);
});
