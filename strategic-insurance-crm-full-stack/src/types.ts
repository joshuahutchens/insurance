export type CustomerStatus =
  | "Opportunity"
  | "Lead"
  | "Application"
  | "Quoted"
  | "Submitted"
  | "Bound"
  | "Current"
  | "Renewal"
  | "Lost"
  | "Archived";

export type Priority = "Low" | "Medium" | "High" | "Urgent";

export interface Policy {
  id: string;
  type: string;
  carrier: string;
  policyNumber: string;
  premium: number;
  deductible: number;
  effective: string;
  expiration: string;
  status: "Active" | "Pending" | "Expired";
}

export interface Claim {
  id: string;
  customerId: string;
  number: string;
  type: string;
  carrier: string;
  status: string;
  dateOfLoss: string;
  updatedAt: string;
  adjuster: string;
  reserve: number;
}

export interface Task {
  id: string;
  customerId: string;
  title: string;
  due: string;
  priority: Priority;
  assignee: string;
  completed: boolean;
}

export interface Communication {
  id: string;
  customerId: string;
  channel: "Email" | "SMS" | "Call" | "Note" | "Meeting";
  direction: "inbound" | "outbound" | "internal";
  author: string;
  body: string;
  timestamp: string;
  unread?: boolean;
}

export interface TimelineEvent {
  id: string;
  customerId: string;
  type: string;
  title: string;
  detail: string;
  timestamp: string;
}

export interface Customer {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  status: CustomerStatus;
  source: string;
  assignedAgent: string;
  csr: string;
  healthScore: number;
  estimatedPremium: number;
  renewalDate: string;
  industry: string;
  tags: string[];
  policies: Policy[];
  lastContact: string;
}

export type Page =
  | "dashboard"
  | "customers"
  | "customer"
  | "analyzer"
  | "discovery"
  | "claims"
  | "communications"
  | "automations"
  | "reports"
  | "admin";
