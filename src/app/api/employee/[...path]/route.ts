import { ZodError } from "zod";
import { NextRequest, NextResponse } from "next/server";
import {
  createEmployeeSession,
  destroyEmployeeSession,
  getEmployeeSession,
  isEmployeeMockEnabled,
  requireEmployeeSession,
} from "@/lib/platform-api/auth";
import {
  inventoryConflictMessage,
  PlatformApiError,
  toPlatformApiError,
} from "@/lib/platform-api/errors";
import { adaptPlatformResponse } from "@/lib/platform-api/adapters";
import { can, type CommercePermission } from "@/lib/platform-api/permissions";
import { createBrandedPdf } from "@/lib/platform-api/pdf";
import {
  cancelReservation,
  confirmOrder,
  createCustomer,
  createQuote,
  downloadQuotePdf,
  downloadReceiptPdf,
  getCatalog,
  getCustomers,
  getEmployeeDashboard,
  getOrder,
  getOrders,
  getQuote,
  getQuotes,
  getReceipt,
  getReservation,
  getReservations,
  requestReservation,
  resetDemoData,
  sendQuote,
  updateCustomer,
  updateQuote,
} from "@/lib/platform-api/server-client";
import type { EmployeeSession } from "@/lib/platform-api/types";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function json<T>(value: T, status = 200) {
  return NextResponse.json(adaptPlatformResponse(value), {
    status,
    headers: { "cache-control": "private, no-store" },
  });
}

function assertPermission(
  session: EmployeeSession,
  permission: CommercePermission,
) {
  if (!can(session.role, permission)) {
    throw new PlatformApiError(
      403,
      "FORBIDDEN",
      "No tienes permiso para realizar esta acción.",
    );
  }
}

async function readJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    throw new PlatformApiError(
      400,
      "INVALID_JSON",
      "La solicitud no contiene JSON válido.",
    );
  }
}

async function localSimulation(request: NextRequest) {
  if (!isEmployeeMockEnabled()) return;
  const simulation = request.nextUrl.searchParams.get("simulate");

  const delay = Math.min(
    Math.max(Number(process.env.EMPLOYEE_MOCK_DELAY_MS || 80), 0),
    1500,
  );
  if (delay) await new Promise((resolve) => setTimeout(resolve, delay));

  const simulated: Record<string, PlatformApiError> = {
    "401": new PlatformApiError(401, "SESSION_EXPIRED", "La sesión venció."),
    "403": new PlatformApiError(403, "FORBIDDEN", "No tienes permiso."),
    "409": new PlatformApiError(
      409,
      "INVENTORY_CONFLICT",
      inventoryConflictMessage,
    ),
    "422": new PlatformApiError(
      422,
      "INVALID_QUANTITY",
      "La cantidad solicitada no es válida.",
    ),
    "500": new PlatformApiError(
      500,
      "SIMULATED_ERROR",
      "Error interno simulado.",
    ),
  };

  if (simulation && simulated[simulation]) throw simulated[simulation];
}

function errorResponse(error: unknown) {
  const apiError =
    error instanceof ZodError
      ? new PlatformApiError(
          422,
          "VALIDATION_ERROR",
          "Revisa los datos enviados.",
          error.flatten(),
        )
      : toPlatformApiError(error);

  return NextResponse.json(
    {
      error: {
        code: apiError.code,
        message: apiError.message,
        status: apiError.status,
        ...(apiError.details ? { details: apiError.details } : {}),
      },
    },
    {
      status: apiError.status,
      headers: { "cache-control": "private, no-store" },
    },
  );
}

async function routeParts(context: RouteContext) {
  return (await context.params).path || [];
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await localSimulation(request);
    const parts = await routeParts(context);

    if (parts[0] === "auth" && parts[1] === "session") {
      const session = await getEmployeeSession();
      return session
        ? json({ session })
        : json({ session: null }, 401);
    }

    const session = await requireEmployeeSession();

    if (parts[0] === "dashboard") {
      return json(await getEmployeeDashboard(session));
    }
    if (parts[0] === "catalog") {
      assertPermission(session, "catalog:read");
      return json(
        await getCatalog(session, {
          query: request.nextUrl.searchParams.get("query") || undefined,
          manufacturer:
            request.nextUrl.searchParams.get("manufacturer") || undefined,
          category: request.nextUrl.searchParams.get("category") || undefined,
          status:
            (request.nextUrl.searchParams.get("status") as
              | "available"
              | "low_stock"
              | "partially_reserved"
              | "temporarily_reserved"
              | "unavailable"
              | "updating"
              | null) || undefined,
          sort:
            (request.nextUrl.searchParams.get("sort") as
              | "availability"
              | "mpn"
              | "price_asc"
              | "price_desc"
              | null) || undefined,
          page: Number(request.nextUrl.searchParams.get("page") || 1),
          pageSize: Number(request.nextUrl.searchParams.get("pageSize") || 24),
        }),
      );
    }
    if (parts[0] === "customers") {
      assertPermission(session, "customers:read");
      return json(await getCustomers(session));
    }
    if (parts[0] === "quotes" && parts[1] && parts[2] === "pdf") {
      const quote = await downloadQuotePdf(session, parts[1]);
      const pdf = await createBrandedPdf({
        documentTitle: "COTIZACIÓN COMERCIAL",
        statusText: "Disponibilidad sujeta a confirmación",
        number: quote.number,
        date: quote.createdAt.slice(0, 10),
        seller: quote.sellerName,
        sellerEmail: quote.sellerEmail,
        customer: quote.customer.companyOrName,
        customerContact: quote.customer.contact,
        customerEmail: quote.customer.email,
        customerPhone: quote.customer.phone,
        taxId: quote.customer.taxId,
        address: [
          quote.customer.address,
          quote.customer.addressLine2,
          quote.customer.city,
          quote.customer.stateOrProvince,
          quote.customer.postalCode,
          quote.customer.country,
        ]
          .filter(Boolean)
          .join(", "),
        deliveryRecipient: quote.customer.deliveryRecipient,
        deliveryContact: `${quote.customer.deliveryEmail} / ${quote.customer.deliveryPhone}`,
        purchaseOrderReference: quote.customer.purchaseOrderReference,
        currency: quote.currency,
        rows: quote.items.map((item) => ({
          mpn: item.mpn,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.authorizedUnitPrice,
          subtotal: item.lineSubtotal,
        })),
        subtotal: quote.subtotal,
        tax: quote.tax,
        total: quote.total,
        notes: quote.notes,
        terms: quote.commercialTerms,
        validity: quote.validUntil,
        mock: quote.mock,
      });
      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          "content-type": "application/pdf",
          "content-disposition": `attachment; filename="${quote.number}.pdf"`,
          "cache-control": "private, no-store",
        },
      });
    }
    if (parts[0] === "quotes" && parts[1]) {
      return json(await getQuote(session, parts[1]));
    }
    if (parts[0] === "quotes") {
      return json(await getQuotes(session));
    }
    if (parts[0] === "reservations" && parts[1]) {
      return json(await getReservation(session, parts[1]));
    }
    if (parts[0] === "reservations") {
      return json(await getReservations(session));
    }
    if (parts[0] === "orders" && parts[1] && parts[2] === "receipt") {
      const receipt = await downloadReceiptPdf(session, parts[1]);
      const order = receipt.order;
      const pdf = await createBrandedPdf({
        documentTitle: "RECIBO COMERCIAL",
        statusText: "Pedido confirmado",
        number: receipt.number,
        orderNumber: order.number,
        quoteNumber: order.quoteNumber,
        date: receipt.issuedAt.slice(0, 10),
        seller: order.sellerName,
        sellerEmail: order.sellerEmail,
        customer: order.customer.companyOrName,
        customerContact: order.customer.contact,
        customerEmail: order.customer.email,
        customerPhone: order.customer.phone,
        taxId: order.customer.taxId,
        address: [
          order.customer.address,
          order.customer.addressLine2,
          order.customer.city,
          order.customer.stateOrProvince,
          order.customer.postalCode,
          order.customer.country,
        ]
          .filter(Boolean)
          .join(", "),
        deliveryRecipient: order.customer.deliveryRecipient,
        deliveryContact: `${order.customer.deliveryEmail} / ${order.customer.deliveryPhone}`,
        purchaseOrderReference: order.customer.purchaseOrderReference,
        currency: order.currency,
        rows: order.items.map((item) => ({
          mpn: item.mpn,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.authorizedUnitPrice,
          subtotal: item.lineSubtotal,
        })),
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        paymentStatus: order.paymentStatus,
        verificationReference: receipt.verificationReference,
        terms: "Documento emitido para un pedido confirmado.",
        mock: receipt.mock,
      });
      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          "content-type": "application/pdf",
          "content-disposition": `attachment; filename="${receipt.number}.pdf"`,
          "cache-control": "private, no-store",
        },
      });
    }
    if (parts[0] === "orders" && parts[1]) {
      return json(await getOrder(session, parts[1]));
    }
    if (parts[0] === "orders") {
      return json(await getOrders(session));
    }
    if (parts[0] === "receipts" && parts[1]) {
      return json(await getReceipt(session, parts[1]));
    }

    throw new PlatformApiError(404, "NOT_FOUND", "Ruta no encontrada.");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await localSimulation(request);
    const parts = await routeParts(context);

    if (parts[0] === "auth" && parts[1] === "session") {
      const session = await createEmployeeSession(await readJson(request));
      return json({ session }, 201);
    }

    const session = await requireEmployeeSession();
    const body = await readJson(request);

    if (parts[0] === "demo" && parts[1] === "reset") {
      return json(await resetDemoData(session));
    }
    if (parts[0] === "customers") {
      assertPermission(session, "customers:create");
      return json(await createCustomer(session, body), 201);
    }
    if (parts[0] === "quotes" && parts[1] && parts[2] === "send") {
      assertPermission(session, "quotes:own");
      return json(await sendQuote(session, parts[1]));
    }
    if (parts[0] === "quotes") {
      assertPermission(session, "quotes:own");
      return json(await createQuote(session, body), 201);
    }
    if (parts[0] === "reservations" && parts[1] && parts[2] === "cancel") {
      assertPermission(
        session,
        session.role === "employee"
          ? "reservations:own"
          : "reservations:cancel_team",
      );
      return json(await cancelReservation(session, parts[1]));
    }
    if (parts[0] === "reservations") {
      assertPermission(session, "reservations:own");
      return json(await requestReservation(session, body), 201);
    }
    if (parts[0] === "orders") {
      assertPermission(session, "orders:own");
      return json(await confirmOrder(session, body), 201);
    }

    throw new PlatformApiError(404, "NOT_FOUND", "Ruta no encontrada.");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await localSimulation(request);
    const parts = await routeParts(context);
    const session = await requireEmployeeSession();
    const body = await readJson(request);

    if (parts[0] === "customers" && parts[1]) {
      assertPermission(session, "customers:update");
      return json(await updateCustomer(session, parts[1], body));
    }
    if (parts[0] === "quotes" && parts[1]) {
      assertPermission(session, "quotes:own");
      return json(await updateQuote(session, parts[1], body));
    }

    throw new PlatformApiError(404, "NOT_FOUND", "Ruta no encontrada.");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const parts = await routeParts(context);
    if (parts[0] !== "auth" || parts[1] !== "session") {
      throw new PlatformApiError(404, "NOT_FOUND", "Ruta no encontrada.");
    }
    await destroyEmployeeSession();
    return json({ ok: true as const });
  } catch (error) {
    return errorResponse(error);
  }
}
