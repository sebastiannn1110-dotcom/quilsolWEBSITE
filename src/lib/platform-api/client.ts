import type {
  CatalogQuery,
  ConfirmOrderInput,
  CreateCustomerInput,
  CreateQuoteInput,
  Customer,
  EmployeeDashboard,
  EmployeeSession,
  Order,
  PaginatedResponse,
  Product,
  Quote,
  Receipt,
  RequestReservationInput,
  Reservation,
} from "./types";

export class CommerceClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "CommerceClientError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/employee${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const fallback = {
      error: {
        code: `HTTP_${response.status}`,
        message: "No fue posible completar la operación.",
        details: undefined,
      },
    };
    const body = await response.json().catch(() => fallback);
    throw new CommerceClientError(
      response.status,
      body.error?.code || fallback.error.code,
      body.error?.message || fallback.error.message,
      body.error?.details,
    );
  }

  return (await response.json()) as T;
}

function query(values: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export const commerceClient = {
  login(input: { email: string; password: string; remember: boolean }) {
    return request<{ session: EmployeeSession }>("/auth/session", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  logout() {
    return request<{ ok: true }>("/auth/session", { method: "DELETE" });
  },
  resetDemo() {
    return request<{
      products: number;
      customers: number;
      quotes: number;
      reservations: number;
      orders: number;
      receipts: number;
      resetAt: string;
    }>("/demo/reset", {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
  dashboard() {
    return request<EmployeeDashboard>("/dashboard");
  },
  catalog(input: CatalogQuery = {}) {
    return request<PaginatedResponse<Product>>(`/catalog${query(input)}`);
  },
  customers() {
    return request<Customer[]>("/customers");
  },
  createCustomer(input: CreateCustomerInput) {
    return request<Customer>("/customers", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  updateCustomer(customerId: string, input: CreateCustomerInput) {
    return request<Customer>(`/customers/${encodeURIComponent(customerId)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  quotes() {
    return request<Quote[]>("/quotes");
  },
  createQuote(input: CreateQuoteInput) {
    return request<Quote>("/quotes", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  requestReservation(input: RequestReservationInput) {
    return request<Reservation>("/reservations", {
      method: "POST",
      body: JSON.stringify(input),
      headers: { "idempotency-key": input.idempotencyKey },
    });
  },
  confirmOrder(input: ConfirmOrderInput) {
    return request<Order>("/orders", {
      method: "POST",
      body: JSON.stringify(input),
      headers: { "idempotency-key": input.idempotencyKey },
    });
  },
  receipt(receiptId: string) {
    return request<Receipt>(`/receipts/${encodeURIComponent(receiptId)}`);
  },
};
