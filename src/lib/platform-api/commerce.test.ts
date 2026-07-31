import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  employeeAuthMode,
  verifyMockEmployeeCredentials,
} from "./auth";
import { adaptPlatformResponse } from "./adapters";
import { parseDemoDraft, serializeDemoDraft } from "./demo-draft";
import { PlatformApiError } from "./errors";
import {
  confirmMockOrder,
  createMockQuote,
  getMockCatalog,
  getMockCustomers,
  getMockProductById,
  getMockReceiptByOrder,
  requestMockReservation,
  resetMockStore,
  sendMockQuote,
} from "./mock";
import { createBrandedPdf } from "./pdf";
import {
  can,
  canViewSellerRecord,
  maximumDiscountByRole,
} from "./permissions";
import {
  createQuoteInputSchema,
  customerInputSchema,
  quoteItemInputSchema,
} from "./schemas";
import type { EmployeeSession } from "./types";

const testPassword = "local-test-password";

const sessions = {
  admin: {
    userId: "employee-admin-demo",
    email: "adminuser1@quiksol.local",
    fullName: "prueba admin",
    role: "admin",
    expiresAt: "2099-01-01T00:00:00.000Z",
    provider: "mock",
  },
  manager: {
    userId: "employee-manager-demo",
    email: "manager1@quiksol.local",
    fullName: "prueba manger",
    role: "manager",
    expiresAt: "2099-01-01T00:00:00.000Z",
    provider: "mock",
  },
  employee: {
    userId: "employee-sales-demo",
    email: "empleado1@quiksol.local",
    fullName: "prueba empleado",
    role: "employee",
    expiresAt: "2099-01-01T00:00:00.000Z",
    provider: "mock",
  },
} satisfies Record<string, EmployeeSession>;

beforeEach(() => {
  vi.stubEnv("EMPLOYEE_MOCK_PASSWORD", testPassword);
  vi.stubEnv("EMPLOYEE_COMMERCE_DEMO_MODE", "true");
  vi.stubEnv("NODE_ENV", "test");
});

describe("autenticación mock", () => {
  it.each([
    ["adminuser1@quiksol.local", "admin"],
    ["manager1@quiksol.local", "manager"],
    ["empleado1@quiksol.local", "employee"],
  ])("autentica %s con rol %s", (email, role) => {
    expect(verifyMockEmployeeCredentials(email, testPassword).role).toBe(role);
  });

  it("rechaza credenciales inválidas", () => {
    expect(() =>
      verifyMockEmployeeCredentials(
        "empleado1@quiksol.local",
        "incorrecta",
      ),
    ).toThrowError(PlatformApiError);
  });

  it("bloquea operaciones si el modo demo está apagado y no hay API", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("EMPLOYEE_COMMERCE_DEMO_MODE", "false");
    vi.stubEnv("PLATFORM_API_BASE_URL", "");
    expect(employeeAuthMode()).toBe("pending");
  });

  it("permite la demo explícita sin intentar conectar una API real", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("EMPLOYEE_COMMERCE_DEMO_MODE", "true");
    vi.stubEnv("PLATFORM_API_BASE_URL", "https://quick-sol.invalid");
    expect(employeeAuthMode()).toBe("mock");
  });
});

describe("permisos centrales", () => {
  it("limita al empleado a sus propias operaciones", () => {
    expect(can(sessions.employee.role, "quotes:team")).toBe(false);
    expect(
      canViewSellerRecord(
        sessions.employee.role,
        sessions.employee.userId,
        sessions.manager.userId,
      ),
    ).toBe(false);
  });

  it("permite al manager consultar el equipo y al admin todo", () => {
    expect(can(sessions.manager.role, "quotes:team")).toBe(true);
    expect(can(sessions.admin.role, "quotes:all")).toBe(true);
    expect(can(sessions.admin.role, "permissions:manage")).toBe(true);
  });

  it("aplica límites de descuento por rol", () => {
    expect(maximumDiscountByRole.employee).toBeLessThan(
      maximumDiscountByRole.manager,
    );
    expect(maximumDiscountByRole.manager).toBeLessThan(
      maximumDiscountByRole.admin,
    );
  });
});

describe("validación de entrada", () => {
  it("carga los 48 productos sintéticos del catálogo", () => {
    expect(getMockCatalog({ pageSize: 100 }).total).toBe(48);
  });

  it("conserva MPN como texto y permite ceros y guiones", () => {
    const result = getMockCatalog({ query: "QKS-0001-A", pageSize: 100 });
    expect(result.data[0]?.mpn).toBe("QKS-0001-A");
  });

  it("impide cantidades negativas o superiores al límite", () => {
    expect(() =>
      quoteItemInputSchema.parse({
        productId: "demo-product-001",
        quantity: -1,
      }),
    ).toThrow();
    expect(() =>
      quoteItemInputSchema.parse({
        productId: "demo-product-001",
        quantity: 100_001,
      }),
    ).toThrow();
  });

  it("rechaza un producto que no existe en el catálogo", () => {
    const customer = getMockCustomers(sessions.employee)[0];
    expect(() =>
      createMockQuote(sessions.employee, {
        customerId: customer.id,
        items: [{ productId: "producto-manual-inexistente", quantity: 1 }],
        validUntil: "2099-01-08",
        notes: "",
        commercialTerms: "",
      }),
    ).toThrowError(
      expect.objectContaining({ status: 404, code: "PRODUCT_NOT_FOUND" }),
    );
  });

  it("valida los datos obligatorios de clientes", () => {
    expect(() =>
      customerInputSchema.parse({
        companyOrName: "",
        contact: "",
        email: "no-es-email",
        phone: "1",
      }),
    ).toThrow();
  });
});

describe("cotizaciones, reservas y pedidos", () => {
  it("calcula precios y totales en servidor sin modificar inventario", () => {
    const product = getMockProductById("demo-product-002");
    const before = product.availability.availableQuantity;
    const customer = getMockCustomers(sessions.employee)[0];
    const quote = createMockQuote(sessions.employee, {
      customerId: customer.id,
      items: [{ productId: product.id, quantity: 2, discountPercent: 2 }],
      validUntil: "2099-01-08",
      notes: "",
      commercialTerms: "",
    });

    expect(quote.subtotal).toBeGreaterThan(0);
    expect(quote.tax).toBeGreaterThan(0);
    expect(quote.total).toBeCloseTo(quote.subtotal + quote.tax, 2);
    expect(product.availability.availableQuantity).toBe(before);
  });

  it("rechaza descuentos que requieren aprobación", () => {
    const customer = getMockCustomers(sessions.employee)[0];
    expect(() =>
      createMockQuote(sessions.employee, {
        customerId: customer.id,
        items: [
          {
            productId: "demo-product-003",
            quantity: 1,
            discountPercent: 12,
          },
        ],
        validUntil: "2099-01-08",
        notes: "",
        commercialTerms: "",
      }),
    ).toThrowError(PlatformApiError);
  });

  it("marca una cotización borrador como enviada", () => {
    const customer = getMockCustomers(sessions.employee)[0];
    const quote = createMockQuote(sessions.employee, {
      customerId: customer.id,
      items: [{ productId: "demo-product-005", quantity: 1 }],
      validUntil: "2099-01-08",
      notes: "",
      commercialTerms: "",
    });
    expect(sendMockQuote(sessions.employee, quote.id).status).toBe("sent");
  });

  it("produce 409 cuando el inventario cambió y conserva la cotización", () => {
    const customer = getMockCustomers(sessions.employee)[0];
    const product = getMockProductById("demo-product-004");
    const quote = createMockQuote(sessions.employee, {
      customerId: customer.id,
      items: [{ productId: product.id, quantity: 1 }],
      validUntil: "2099-01-08",
      notes: "",
      commercialTerms: "",
    });

    expect(() =>
      requestMockReservation(sessions.employee, {
        quoteId: quote.id,
        inventoryRevisions: {
          [product.id]: product.availability.revision + 1,
        },
        idempotencyKey: crypto.randomUUID(),
      }),
    ).toThrowError(
      expect.objectContaining({ status: 409, code: "INVENTORY_CONFLICT" }),
    );
    expect(quote.status).toBe("draft");
  });

  it("crea una única reserva por clave idempotente", () => {
    const customer = getMockCustomers(sessions.employee)[0];
    const product = getMockProductById("demo-product-006");
    const quote = createMockQuote(sessions.employee, {
      customerId: customer.id,
      items: [{ productId: product.id, quantity: 1 }],
      validUntil: "2099-01-08",
      notes: "",
      commercialTerms: "",
    });
    const idempotencyKey = crypto.randomUUID();
    const input = {
      quoteId: quote.id,
      inventoryRevisions: {
        [product.id]: product.availability.revision,
      },
      idempotencyKey,
    };
    const first = requestMockReservation(sessions.employee, input);
    const replay = requestMockReservation(sessions.employee, input);
    expect(replay.id).toBe(first.id);
  });

  it("convierte una reserva activa en pedido y permite recibo confirmado", () => {
    const customer = getMockCustomers(sessions.employee)[0];
    const products = [
      getMockProductById("demo-product-008"),
      getMockProductById("demo-product-009"),
      getMockProductById("demo-product-010"),
    ];
    const quote = createMockQuote(sessions.employee, {
      customerId: customer.id,
      items: products.map((product, index) => ({
        productId: product.id,
        quantity: index + 1,
      })),
      validUntil: "2099-01-08",
      notes: "",
      commercialTerms: "",
    });
    const reservation = requestMockReservation(sessions.employee, {
      quoteId: quote.id,
      inventoryRevisions: Object.fromEntries(
        products.map((product) => [
          product.id,
          product.availability.revision,
        ]),
      ),
      idempotencyKey: crypto.randomUUID(),
    });
    const order = confirmMockOrder(sessions.employee, {
      reservationId: reservation.id,
      idempotencyKey: crypto.randomUUID(),
    });
    const receipt = getMockReceiptByOrder(sessions.employee, order.id);

    expect(order.status).toBe("confirmed");
    expect(receipt.orderId).toBe(order.id);
    expect(receipt.mock).toBe(true);
    expect(receipt.order.quoteNumber).toBe(quote.number);
    expect(receipt.order.items.map((item) => item.productId)).toEqual(
      quote.items.map((item) => item.productId),
    );
    expect(receipt.order.items.map((item) => item.quantity)).toEqual(
      quote.items.map((item) => item.quantity),
    );
  });

  it("no acepta precio ni total manipulados en el contrato de creación", () => {
    const parsed = createQuoteInputSchema.safeParse({
      customerId: "demo-customer-001",
      items: [
        {
          productId: "demo-product-001",
          quantity: 1,
          authorizedUnitPrice: 0.01,
        },
      ],
      validUntil: "2099-01-08",
      total: 0.01,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).not.toHaveProperty("total");
      expect(parsed.data.items[0]).not.toHaveProperty("authorizedUnitPrice");
    }
  });
});

describe("campos confidenciales", () => {
  it.each(["cost", "internalCost", "supplierCost", "gp", "margin"])(
    "rechaza el campo prohibido %s",
    (field) => {
      expect(() => adaptPlatformResponse({ product: { [field]: 1 } })).toThrow(
        PlatformApiError,
      );
    },
  );
});

describe("continuidad temporal de la demostración", () => {
  it("conserva cliente y productos al navegar entre páginas", () => {
    const snapshot = {
      customerId: "demo-customer-001",
      items: [
        {
          productId: "demo-product-001",
          mpn: "QKS-0001-A",
          quantity: 3,
        },
      ],
    };
    expect(parseDemoDraft(serializeDemoDraft(snapshot))).toEqual(snapshot);
  });

  it("reinicia catálogo, clientes y operaciones sintéticas", () => {
    const result = resetMockStore();
    expect(result).toMatchObject({
      products: 48,
      customers: 3,
      quotes: 1,
      reservations: 1,
      orders: 1,
      receipts: 1,
    });
  });
});

describe("documentos de demostración", () => {
  it("genera un PDF de recibo marcado y con referencias comerciales", async () => {
    const pdf = await createBrandedPdf({
      documentTitle: "RECIBO DE DEMOSTRACIÓN",
      statusText: "Pedido demo confirmado",
      number: "REC-DEMO-0099",
      orderNumber: "PED-DEMO-0099",
      quoteNumber: "COT-DEMO-0099",
      date: "2099-01-01",
      seller: "Vendedor Sintético",
      customer: "Cliente Sintético",
      address: "Dirección de prueba",
      currency: "USD",
      rows: [
        {
          mpn: "QKS-0001-A",
          description: "Producto sintético",
          quantity: 3,
          unitPrice: 10,
          subtotal: 30,
        },
      ],
      subtotal: 30,
      tax: 2.1,
      total: 32.1,
      paymentStatus: "pending",
      verificationReference: "DEMO-VERIFY-0099",
      mock: true,
    });
    const source = pdf.toString("latin1");
    expect(source.startsWith("%PDF-1.4")).toBe(true);
    expect(source).toContain("RECIBO DE DEMOSTRACI");
    expect(source).toContain("Pedido demo confirmado");
    expect(source).toContain("COT-DEMO-0099");
    expect(source).toContain("DOCUMENTO DE PRUEBA");
    expect(source).toContain("SIN VALIDEZ COMERCIAL");
  });
});
