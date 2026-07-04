import { eq } from "drizzle-orm";
import { db } from "./db.js";
import {
  agencies,
  claims,
  communications,
  customers,
  policies,
  tasks,
  tenants,
  timelineEvents,
  users,
} from "./schema.js";
import { hashPassword } from "./security.js";

export const DEMO_TENANT_ID = "tenant-northstar";
export const DEMO_AGENCY_ID = "agency-northstar";
export const DEMO_USER_ID = "user-alex";

const customerSeed = [
  ["cus-001", "Timberline Outdoor Supply", "Maya Chen", "maya@timberlineoutdoor.com", "(970) 555-0148", "1280 Canyon View Rd", "Fort Collins", "CO", "Renewal", "Analyzer", "Alex Morgan", "Jordan Lee", 78, "48200", "2026-08-18", "Outdoor Retail", ["Key Account", "Multi-policy"], "2026-07-02T15:40:00Z"],
  ["cus-002", "Juniper Ridge Dental", "Dr. Elena Ruiz", "elena@juniperridgedental.com", "(303) 555-0181", "4400 W 38th Ave", "Denver", "CO", "Current", "Referral", "Sam Patel", "Jordan Lee", 92, "31750", "2026-11-03", "Dental Practice", ["Referral", "High retention"], "2026-06-29T11:15:00Z"],
  ["cus-003", "Bluebird Coffee Roasters", "Theo Wilson", "theo@bluebirdroasters.com", "(720) 555-0133", "1918 Market St", "Denver", "CO", "Quoted", "Website", "Alex Morgan", "Taylor Reed", 64, "22400", "2026-09-12", "Food Manufacturing", ["Hot lead"], "2026-06-25T09:30:00Z"],
  ["cus-004", "Red Peak Construction", "Marcus Hill", "marcus@redpeakco.com", "(719) 555-0192", "78 Mesa Industrial Way", "Colorado Springs", "CO", "Application", "Discovery", "Sam Patel", "Taylor Reed", 71, "87500", "2026-10-01", "Commercial Construction", ["High premium", "WC opportunity"], "2026-07-01T14:00:00Z"],
  ["cus-005", "Sage & Stone Design", "Priya Shah", "priya@sageandstone.co", "(970) 555-0176", "603 Pearl St", "Boulder", "CO", "Lead", "Manual", "Alex Morgan", "Jordan Lee", 55, "14800", "2026-12-14", "Interior Design", ["New business"], "2026-06-12T16:20:00Z"],
  ["cus-006", "Front Range Pediatrics", "Nora Bennett", "nora@frpediatrics.com", "(303) 555-0114", "8250 E Belleview Ave", "Greenwood Village", "CO", "Current", "Import", "Sam Patel", "Jordan Lee", 88, "56400", "2027-01-22", "Healthcare", ["Key Account"], "2026-07-02T10:05:00Z"],
  ["cus-007", "Apex Electric & Solar", "Daniel Kim", "daniel@apexsolar.co", "(720) 555-0167", "3100 Blake St", "Denver", "CO", "Opportunity", "Discovery", "Unassigned", "Unassigned", 42, "69200", "2026-09-28", "Electrical Contractor", ["AI discovered"], "2026-05-28T08:00:00Z"],
] as const;

export async function seedDatabase() {
  const existing = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.id, DEMO_TENANT_ID)).limit(1);
  if (existing.length) return;

  await db.insert(tenants).values({
    id: DEMO_TENANT_ID,
    name: "Northstar Agency",
    slug: "northstar",
    plan: "professional",
  });
  await db.insert(agencies).values({
    id: DEMO_AGENCY_ID,
    tenantId: DEMO_TENANT_ID,
    name: "Northstar Agency",
    settings: { brandColor: "#1f665d", aiEnabled: true },
  });
  await db.insert(users).values({
    id: DEMO_USER_ID,
    tenantId: DEMO_TENANT_ID,
    agencyId: DEMO_AGENCY_ID,
    name: "Alex Morgan",
    email: "alex@northstaragency.com",
    passwordHash: await hashPassword("strategicdemo"),
    role: "owner",
  });

  await db.insert(customers).values(customerSeed.map((row) => ({
    id: row[0],
    tenantId: DEMO_TENANT_ID,
    agencyId: DEMO_AGENCY_ID,
    company: row[1],
    contact: row[2],
    email: row[3],
    phone: row[4],
    address: row[5],
    city: row[6],
    state: row[7],
    status: row[8],
    source: row[9],
    assignedAgent: row[10],
    csr: row[11],
    healthScore: row[12],
    estimatedPremium: row[13],
    renewalDate: row[14],
    industry: row[15],
    tags: [...row[16]],
    lastContact: new Date(row[17]),
  })));

  await db.insert(policies).values([
    { id: "pol-001", tenantId: DEMO_TENANT_ID, customerId: "cus-001", type: "Business Owners Policy", carrier: "Travelers", policyNumber: "BOP-884201", premium: "28600", deductible: "2500", effective: "2025-08-18", expiration: "2026-08-18", status: "Active" },
    { id: "pol-002", tenantId: DEMO_TENANT_ID, customerId: "cus-001", type: "Commercial Auto", carrier: "Progressive", policyNumber: "CA-442981", premium: "19600", deductible: "1000", effective: "2025-08-18", expiration: "2026-08-18", status: "Active" },
    { id: "pol-003", tenantId: DEMO_TENANT_ID, customerId: "cus-002", type: "Professional Liability", carrier: "CNA", policyNumber: "PL-229184", premium: "31750", deductible: "5000", effective: "2025-11-03", expiration: "2026-11-03", status: "Active" },
    { id: "pol-004", tenantId: DEMO_TENANT_ID, customerId: "cus-006", type: "Medical Professional Liability", carrier: "The Doctors Company", policyNumber: "MPL-703118", premium: "56400", deductible: "10000", effective: "2026-01-22", expiration: "2027-01-22", status: "Active" },
  ]);

  await db.insert(tasks).values([
    { id: "task-1", tenantId: DEMO_TENANT_ID, customerId: "cus-001", title: "Review renewal exposure changes", due: "2026-07-03", priority: "Urgent", assignee: "Alex Morgan" },
    { id: "task-2", tenantId: DEMO_TENANT_ID, customerId: "cus-004", title: "Collect signed loss runs", due: "2026-07-03", priority: "High", assignee: "Sam Patel" },
    { id: "task-3", tenantId: DEMO_TENANT_ID, customerId: "cus-003", title: "Follow up on BOP proposal", due: "2026-07-04", priority: "High", assignee: "Alex Morgan" },
    { id: "task-4", tenantId: DEMO_TENANT_ID, customerId: "cus-005", title: "Schedule discovery call", due: "2026-07-06", priority: "Medium", assignee: "Alex Morgan" },
    { id: "task-5", tenantId: DEMO_TENANT_ID, customerId: "cus-002", title: "Confirm cyber questionnaire", due: "2026-07-01", priority: "Medium", assignee: "Jordan Lee" },
  ]);

  await db.insert(communications).values([
    { id: "com-1", tenantId: DEMO_TENANT_ID, customerId: "cus-001", channel: "Email", direction: "inbound", author: "Maya Chen", body: "I uploaded the updated inventory schedule. We also added a second delivery van last month—does that change what you need for renewal?", occurredAt: new Date("2026-07-02T15:40:00Z"), unread: true },
    { id: "com-2", tenantId: DEMO_TENANT_ID, customerId: "cus-001", channel: "Call", direction: "outbound", author: "Alex Morgan", body: "18 min call. Reviewed property claim status and agreed to include the new Boulder pop-up location in the renewal review.", occurredAt: new Date("2026-06-30T10:15:00Z") },
    { id: "com-3", tenantId: DEMO_TENANT_ID, customerId: "cus-001", channel: "Note", direction: "internal", author: "Jordan Lee", body: "Travelers requested updated values and five-year loss runs. Inventory schedule received; loss runs still outstanding.", occurredAt: new Date("2026-06-27T14:22:00Z") },
    { id: "com-4", tenantId: DEMO_TENANT_ID, customerId: "cus-004", channel: "SMS", direction: "inbound", author: "Marcus Hill", body: "I can send payroll by class code this afternoon. Still waiting on the current carrier for loss runs.", occurredAt: new Date("2026-07-03T08:38:00Z"), unread: true },
    { id: "com-5", tenantId: DEMO_TENANT_ID, customerId: "cus-003", channel: "Email", direction: "outbound", author: "Alex Morgan", body: "Theo, I’ve attached the two options we discussed. The Travelers proposal offers the stronger spoilage limit.", occurredAt: new Date("2026-07-02T11:08:00Z") },
  ]);

  await db.insert(claims).values([
    { id: "claim-1", tenantId: DEMO_TENANT_ID, customerId: "cus-001", number: "TRV-CL-88214", type: "Property", carrier: "Travelers", status: "Waiting on Carrier", dateOfLoss: "2026-06-14", adjuster: "Rita Douglas", reserve: "24000" },
    { id: "claim-2", tenantId: DEMO_TENANT_ID, customerId: "cus-006", number: "TDC-CL-11082", type: "Professional Liability", carrier: "The Doctors Company", status: "Investigation", dateOfLoss: "2026-05-18", adjuster: "Micah Stone", reserve: "85000" },
    { id: "claim-3", tenantId: DEMO_TENANT_ID, customerId: "cus-002", number: "CNA-CL-50991", type: "Equipment Breakdown", carrier: "CNA", status: "Closed", dateOfLoss: "2026-02-03", adjuster: "June Ford", reserve: "9200" },
  ]);

  await db.insert(timelineEvents).values([
    { id: "ev-1", tenantId: DEMO_TENANT_ID, customerId: "cus-001", type: "Document", title: "Inventory schedule uploaded", detail: "2026 Inventory Schedule.xlsx added by Maya Chen", occurredAt: new Date("2026-07-02T15:39:00Z") },
    { id: "ev-2", tenantId: DEMO_TENANT_ID, customerId: "cus-001", type: "Communication", title: "Email received from Maya Chen", detail: "Renewal exposure update and new vehicle disclosed", occurredAt: new Date("2026-07-02T15:40:00Z") },
    { id: "ev-3", tenantId: DEMO_TENANT_ID, customerId: "cus-001", type: "Claim", title: "Claim moved to Waiting on Carrier", detail: "Updated by Jordan Lee", occurredAt: new Date("2026-06-26T12:10:00Z") },
    { id: "ev-4", tenantId: DEMO_TENANT_ID, customerId: "cus-001", type: "Policy", title: "Renewal workflow started", detail: "120-day renewal sequence enrolled automatically", occurredAt: new Date("2026-04-20T09:00:00Z") },
  ]);
}
