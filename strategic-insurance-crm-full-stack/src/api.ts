import type { Communication, Customer, Priority, Task } from "./types";

const API_ROOT = import.meta.env.VITE_API_URL ?? "http://localhost:4174/api";

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error ?? `Request failed (${response.status})`);
  }
  return payload as T;
}

export const api = {
  login(email: string, password: string) {
    return request<{
      token: string;
      expiresAt: string;
      user: { id: string; name: string; email: string; role: string; agencyId: string };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  getCustomers(token: string) {
    return request<{ customers: Customer[] }>("/customers", {}, token);
  },

  getDashboard(token: string) {
    return request<{
      metrics: Record<string, number>;
      tasks: Task[];
      communications: Communication[];
    }>("/dashboard", {}, token);
  },

  createCustomer(
    token: string,
    input: Pick<Customer, "company" | "contact" | "email" | "phone" | "status" | "source">,
  ) {
    return request<{ customer: Customer }>("/customers", {
      method: "POST",
      body: JSON.stringify(input),
    }, token);
  },

  updateTask(token: string, id: string, completed: boolean) {
    return request<{ task: Task }>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ completed }),
    }, token);
  },

  createTask(
    token: string,
    customerId: string,
    input: { title: string; due: string; priority: Priority; assignee: string },
  ) {
    return request<{ task: Task }>(`/customers/${customerId}/tasks`, {
      method: "POST",
      body: JSON.stringify(input),
    }, token);
  },

  createCommunication(
    token: string,
    customerId: string,
    input: Pick<Communication, "channel" | "body" | "direction">,
  ) {
    return request<{ communication: Communication }>(`/customers/${customerId}/communications`, {
      method: "POST",
      body: JSON.stringify(input),
    }, token);
  },
};
