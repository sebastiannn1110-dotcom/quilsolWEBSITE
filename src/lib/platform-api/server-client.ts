import "server-only";

import {
  employeeAuthMode,
  getPlatformAccessToken,
  isEmployeeMockEnabled,
} from "./auth";
import { PlatformApiError } from "./errors";
import {
  cancelMockReservation,
  confirmMockOrder,
  createMockCustomer,
  createMockQuote,
  getMockCatalog,
  getMockCustomers,
  getMockDashboard,
  getMockOrder,
  getMockOrders,
  getMockProductById,
  getMockQuote,
  getMockQuotes,
  getMockReceipt,
  getMockReceiptByOrder,
  getMockReservation,
  getMockReservations,
  requestMockReservation,
  resetMockStore,
  sendMockQuote,
  updateMockCustomer,
  updateMockQuote,
} from "./mock";
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

function queryString(values: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

async function platformFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const baseUrl = process.env.PLATFORM_API_BASE_URL;
  const token = await getPlatformAccessToken();

  if (!baseUrl?.startsWith("https://") || !token) {
    throw new PlatformApiError(
      503,
      "PLATFORM_INTEGRATION_PENDING",
      "Integración con plataforma pendiente.",
    );
  }

  const response = await fetch(
    `${baseUrl.replace(/\/$/, "")}/api/commerce${path}`,
    {
      ...init,
      cache: "no-store",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${token}`,
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...init.headers,
      },
      signal: init.signal || AbortSignal.timeout(15_000),
    },
  );

  if (!response.ok) {
    let message = "La plataforma no pudo completar la operación.";
    let details: unknown;
    try {
      const body = (await response.json()) as {
        error?: { message?: string; details?: unknown };
      };
      message = body.error?.message || message;
      details = body.error?.details;
    } catch {
      // Do not expose upstream HTML or implementation details.
    }

    throw new PlatformApiError(
      response.status,
      `PLATFORM_${response.status}`,
      message,
      details,
    );
  }

  return (await response.json()) as T;
}

function ensureAvailable() {
  if (!isEmployeeMockEnabled() && employeeAuthMode() !== "platform") {
    throw new PlatformApiError(
      503,
      "PLATFORM_INTEGRATION_PENDING",
      "Integración con plataforma pendiente.",
    );
  }
}

export async function resetDemoData(session: EmployeeSession) {
  ensureAvailable();
  void session;
  if (!isEmployeeMockEnabled()) {
    throw new PlatformApiError(
      403,
      "DEMO_MODE_REQUIRED",
      "El reinicio sólo está disponible en modo demostración.",
    );
  }
  return resetMockStore();
}

export async function getEmployeeDashboard(
  session: EmployeeSession,
): Promise<EmployeeDashboard> {
  ensureAvailable();
  return isEmployeeMockEnabled()
    ? getMockDashboard(session)
    : platformFetch<EmployeeDashboard>("/employee/dashboard");
}

export async function getCatalog(
  session: EmployeeSession,
  query: CatalogQuery = {},
): Promise<PaginatedResponse<Product>> {
  ensureAvailable();
  void session;
  return isEmployeeMockEnabled()
    ? getMockCatalog(query)
    : platformFetch<PaginatedResponse<Product>>(
        `/catalog${queryString(query)}`,
      );
}

export async function getProductById(
  session: EmployeeSession,
  productId: string,
): Promise<Product> {
  ensureAvailable();
  void session;
  return isEmployeeMockEnabled()
    ? getMockProductById(productId)
    : platformFetch<Product>(`/catalog/${encodeURIComponent(productId)}`);
}

export async function getCustomers(
  session: EmployeeSession,
): Promise<Customer[]> {
  ensureAvailable();
  return isEmployeeMockEnabled()
    ? getMockCustomers(session)
    : platformFetch<Customer[]>("/customers");
}

export async function createCustomer(
  session: EmployeeSession,
  input: CreateCustomerInput,
): Promise<Customer> {
  ensureAvailable();
  return isEmployeeMockEnabled()
    ? createMockCustomer(session, input)
    : platformFetch<Customer>("/customers", {
        method: "POST",
        body: JSON.stringify(input),
      });
}

export async function updateCustomer(
  session: EmployeeSession,
  customerId: string,
  input: CreateCustomerInput,
): Promise<Customer> {
  ensureAvailable();
  return isEmployeeMockEnabled()
    ? updateMockCustomer(session, customerId, input)
    : platformFetch<Customer>(`/customers/${encodeURIComponent(customerId)}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
}

export async function createQuote(
  session: EmployeeSession,
  input: CreateQuoteInput,
): Promise<Quote> {
  ensureAvailable();
  return isEmployeeMockEnabled()
    ? createMockQuote(session, input)
    : platformFetch<Quote>("/quotes", {
        method: "POST",
        body: JSON.stringify(input),
      });
}

export async function updateQuote(
  session: EmployeeSession,
  quoteId: string,
  input: CreateQuoteInput,
): Promise<Quote> {
  ensureAvailable();
  return isEmployeeMockEnabled()
    ? updateMockQuote(session, quoteId, input)
    : platformFetch<Quote>(`/quotes/${encodeURIComponent(quoteId)}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
}

export async function getQuote(
  session: EmployeeSession,
  quoteId: string,
): Promise<Quote> {
  ensureAvailable();
  return isEmployeeMockEnabled()
    ? getMockQuote(session, quoteId)
    : platformFetch<Quote>(`/quotes/${encodeURIComponent(quoteId)}`);
}

export async function getQuotes(
  session: EmployeeSession,
): Promise<Quote[]> {
  ensureAvailable();
  return isEmployeeMockEnabled()
    ? getMockQuotes(session)
    : platformFetch<Quote[]>("/quotes");
}

export async function sendQuote(
  session: EmployeeSession,
  quoteId: string,
): Promise<Quote> {
  ensureAvailable();
  return isEmployeeMockEnabled()
    ? sendMockQuote(session, quoteId)
    : platformFetch<Quote>(`/quotes/${encodeURIComponent(quoteId)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "sent" }),
      });
}

export async function requestReservation(
  session: EmployeeSession,
  input: RequestReservationInput,
): Promise<Reservation> {
  ensureAvailable();
  return isEmployeeMockEnabled()
    ? requestMockReservation(session, input)
    : platformFetch<Reservation>("/reservations", {
        method: "POST",
        body: JSON.stringify(input),
        headers: { "idempotency-key": input.idempotencyKey },
      });
}

export async function getReservations(
  session: EmployeeSession,
): Promise<Reservation[]> {
  ensureAvailable();
  return isEmployeeMockEnabled()
    ? getMockReservations(session)
    : platformFetch<Reservation[]>("/reservations");
}

export async function getReservation(
  session: EmployeeSession,
  reservationId: string,
): Promise<Reservation> {
  ensureAvailable();
  return isEmployeeMockEnabled()
    ? getMockReservation(session, reservationId)
    : platformFetch<Reservation>(
        `/reservations/${encodeURIComponent(reservationId)}`,
      );
}

export async function cancelReservation(
  session: EmployeeSession,
  reservationId: string,
): Promise<Reservation> {
  ensureAvailable();
  return isEmployeeMockEnabled()
    ? cancelMockReservation(session, reservationId)
    : platformFetch<Reservation>(
        `/reservations/${encodeURIComponent(reservationId)}/cancel`,
        { method: "POST" },
      );
}

export async function confirmOrder(
  session: EmployeeSession,
  input: ConfirmOrderInput,
): Promise<Order> {
  ensureAvailable();
  return isEmployeeMockEnabled()
    ? confirmMockOrder(session, input)
    : platformFetch<Order>("/orders", {
        method: "POST",
        body: JSON.stringify(input),
        headers: { "idempotency-key": input.idempotencyKey },
      });
}

export async function getOrders(
  session: EmployeeSession,
): Promise<Order[]> {
  ensureAvailable();
  return isEmployeeMockEnabled()
    ? getMockOrders(session)
    : platformFetch<Order[]>("/orders");
}

export async function getOrder(
  session: EmployeeSession,
  orderId: string,
): Promise<Order> {
  ensureAvailable();
  return isEmployeeMockEnabled()
    ? getMockOrder(session, orderId)
    : platformFetch<Order>(`/orders/${encodeURIComponent(orderId)}`);
}

export async function getReceipt(
  session: EmployeeSession,
  receiptId: string,
): Promise<Receipt> {
  ensureAvailable();
  return isEmployeeMockEnabled()
    ? getMockReceipt(session, receiptId)
    : platformFetch<Receipt>(`/receipts/${encodeURIComponent(receiptId)}`);
}

export async function getReceiptByOrder(
  session: EmployeeSession,
  orderId: string,
): Promise<Receipt> {
  ensureAvailable();
  return isEmployeeMockEnabled()
    ? getMockReceiptByOrder(session, orderId)
    : platformFetch<Receipt>(
        `/orders/${encodeURIComponent(orderId)}/receipt`,
      );
}

export async function downloadQuotePdf(
  session: EmployeeSession,
  quoteId: string,
) {
  return getQuote(session, quoteId);
}

export async function downloadReceiptPdf(
  session: EmployeeSession,
  orderId: string,
) {
  return getReceiptByOrder(session, orderId);
}
