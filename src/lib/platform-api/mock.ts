import "server-only";

import { PlatformApiError, inventoryConflictMessage } from "./errors";
import { canViewSellerRecord, maximumDiscountByRole } from "./permissions";
import {
  catalogQuerySchema,
  confirmOrderInputSchema,
  createQuoteInputSchema,
  customerInputSchema,
  reservationInputSchema,
} from "./schemas";
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

type MockStore = {
  products: Product[];
  customers: Customer[];
  quotes: Quote[];
  reservations: Reservation[];
  orders: Order[];
  receipts: Receipt[];
  reservationRequests: Map<string, Reservation>;
  orderRequests: Map<string, Order>;
  catalogReads: number;
};

const sellers = {
  admin: {
    id: "employee-admin-demo",
    name: "Administrador Quiksol",
    email: "adminuser1@quiksol.local",
  },
  manager: {
    id: "employee-manager-demo",
    name: "Manager Comercial",
    email: "manager1@quiksol.local",
  },
  employee: {
    id: "employee-sales-demo",
    name: "Asesor Comercial",
    email: "empleado1@quiksol.local",
  },
  sebastian: {
    id: "employee-sebastian-sales",
    name: "Sebastian C.",
    email: "sebastiasc01@gmail.com",
  },
} as const;

const manufacturers = [
  "Aurelia Components",
  "Northstar Micro",
  "Vectora Systems",
  "Orion Embedded",
];
const categories = [
  "Semiconductores",
  "Conectividad",
  "Potencia",
  "Control industrial",
];
const descriptions = [
  "Controlador electrónico para aplicaciones industriales.",
  "Módulo de conectividad para integración de sistemas.",
  "Componente de potencia para equipos electrónicos.",
  "Dispositivo de control para automatización industrial.",
];
const catalogImageUrls = [
  "/images/catalog/c7512.webp",
  "/images/catalog/c7593.webp",
  "/images/catalog/c9864.webp",
  "/images/catalog/c9865.webp",
  "/images/catalog/c7426.webp",
  "/images/catalog/c7928.webp",
  "/images/catalog/c5423.webp",
  "/images/catalog/c7433.webp",
  "/images/catalog/c311983.webp",
  "/images/catalog/c90061.webp",
  "/images/catalog/c116592.webp",
  "/images/catalog/c38663.webp",
  "/images/catalog/c67470.webp",
  "/images/catalog/c10429.webp",
  "/images/catalog/c94832.webp",
  "/images/catalog/c7972.webp",
  "/images/catalog/c80670.webp",
  "/images/catalog/c157527.webp",
  "/images/catalog/c7943.webp",
  "/images/catalog/c138714.webp",
  "/images/catalog/c7549.webp",
  "/images/catalog/c225807.webp",
  "/images/catalog/c7063.webp",
  "/images/catalog/c7467.webp",
  "/images/catalog/c94917.webp",
  "/images/catalog/c23654.webp",
  "/images/catalog/c6820.webp",
  "/images/catalog/c7948.webp",
  "/images/catalog/c63813.webp",
  "/images/catalog/c7722.webp",
  "/images/catalog/c7666.webp",
  "/images/catalog/c17271.webp",
  "/images/catalog/c11334.webp",
  "/images/catalog/c11337.webp",
  "/images/catalog/c398358.webp",
  "/images/catalog/c473912.webp",
  "/images/catalog/c7832.webp",
  "/images/catalog/c48260.webp",
  "/images/catalog/c14347.webp",
  "/images/catalog/c7836.webp",
  "/images/catalog/c67473.webp",
  "/images/catalog/c12594.webp",
  "/images/catalog/c59135.webp",
  "/images/catalog/c779408.webp",
  "/images/catalog/c6966.webp",
  "/images/catalog/c133575.webp",
  "/images/catalog/c26350.webp",
  "/images/catalog/c7835.webp",
] as const;

function availabilityStatus(quantity: number, index: number) {
  if (quantity <= 0) return "unavailable" as const;
  if (index % 11 === 0) return "temporarily_reserved" as const;
  if (index % 7 === 0) return "partially_reserved" as const;
  if (quantity <= 12) return "low_stock" as const;
  return "available" as const;
}

function buildProducts(now: string): Product[] {
  return Array.from({ length: 48 }, (_, index) => {
    const number = index + 1;
    const quantity = index % 13 === 0 ? 0 : ((index * 17 + 9) % 94) + 2;

    return {
      id: `demo-product-${String(number).padStart(3, "0")}`,
      mpn: `QKS-${String(number).padStart(4, "0")}-${String.fromCharCode(
        65 + (index % 5),
      )}`,
      manufacturer: manufacturers[index % manufacturers.length],
      description: descriptions[index % descriptions.length],
      category: categories[index % categories.length],
      imageUrl: catalogImageUrls[index],
      authorizedUnitPrice: Number((3.75 + index * 1.83).toFixed(2)),
      currency: "USD",
      minimumOrderQuantity: index % 5 === 0 ? 10 : 1,
      availability: {
        availableQuantity: quantity,
        status: availabilityStatus(quantity, index),
        updatedAt: now,
        revision: 1,
      },
    };
  });
}

function buildStore(): MockStore {
  const now = new Date().toISOString();
  const products = buildProducts(now);
  const customers: Customer[] = [
    {
      id: "demo-customer-001",
      companyOrName: "Tecnología Andina S.A.S.",
      legalCompanyName: "Tecnología Andina S.A.S.",
      contact: "Andrea Rojas",
      email: "compras@tecnologia-andina.example",
      phone: "+57 300 000 0001",
      country: "Colombia",
      city: "Bogotá",
      address: "Carrera 7 # 72-41",
      addressLine2: "Piso 6",
      stateOrProvince: "Bogotá D.C.",
      postalCode: "110221",
      deliveryRecipient: "Andrea Rojas",
      deliveryPhone: "+57 300 000 0001",
      deliveryEmail: "logistica@tecnologia-andina.example",
      taxId: "900123456-7",
      purchaseOrderReference: "",
      preferredLanguage: "es",
      commercialNotes: "Entrega en horario laboral.",
      createdAt: now,
      createdBy: sellers.employee.id,
    },
    {
      id: "demo-customer-002",
      companyOrName: "Northbridge Systems LLC",
      legalCompanyName: "Northbridge Systems LLC",
      contact: "Carlos Mendes",
      email: "operations@northbridge-systems.example",
      phone: "+1 555 010 2020",
      country: "Estados Unidos",
      city: "Miami",
      address: "202 Brickell Avenue",
      addressLine2: "Suite 540",
      stateOrProvince: "Florida",
      postalCode: "33131",
      deliveryRecipient: "Carlos Mendes",
      deliveryPhone: "+1 555 010 2020",
      deliveryEmail: "warehouse@northbridge-systems.example",
      taxId: "US-84-1234567",
      purchaseOrderReference: "",
      preferredLanguage: "en",
      commercialNotes: "Delivery appointment required.",
      createdAt: now,
      createdBy: sellers.manager.id,
    },
    {
      id: "demo-customer-003",
      companyOrName: "Integraciones del Pacífico S.A.S.",
      legalCompanyName: "Integraciones del Pacífico S.A.S.",
      contact: "María Torres",
      email: "maria@integraciones-pacifico.example",
      phone: "+57 300 000 0003",
      country: "Colombia",
      city: "Medellín",
      address: "Calle 10 # 34-11",
      addressLine2: "Bodega 3",
      stateOrProvince: "Antioquia",
      postalCode: "050021",
      deliveryRecipient: "María Torres",
      deliveryPhone: "+57 300 000 0003",
      deliveryEmail: "despachos@integraciones-pacifico.example",
      taxId: "901234567-8",
      purchaseOrderReference: "",
      preferredLanguage: "es",
      createdAt: now,
      createdBy: sellers.admin.id,
    },
    {
      id: "customer-sebastian-001",
      companyOrName: "Soluciones Industriales del Caribe S.A.S.",
      legalCompanyName: "Soluciones Industriales del Caribe S.A.S.",
      contact: "Laura Méndez",
      email: "compras@soluciones-caribe.example",
      phone: "+57 300 000 0004",
      country: "Colombia",
      city: "Barranquilla",
      address: "Vía 40 # 73-290",
      addressLine2: "Centro Industrial, Bodega 12",
      stateOrProvince: "Atlántico",
      postalCode: "080001",
      deliveryRecipient: "Laura Méndez",
      deliveryPhone: "+57 300 000 0004",
      deliveryEmail: "recepcion@soluciones-caribe.example",
      taxId: "901345678-9",
      purchaseOrderReference: "",
      preferredLanguage: "es",
      commercialNotes: "Coordinar entrega con recepción.",
      createdAt: now,
      createdBy: sellers.sebastian.id,
    },
  ];

  const seededQuote = calculateQuote(
    {
      id: "demo-quote-001",
      number: "COT-0001",
      sellerId: sellers.employee.id,
      sellerName: sellers.employee.name,
      sellerEmail: sellers.employee.email,
      sellerRole: "employee",
      customer: customers[0],
      createdAt: now,
      updatedAt: now,
      currency: "USD",
      items: [],
      subtotal: 0,
      taxRate: 0.07,
      tax: 0,
      total: 0,
      validUntil: new Date(Date.now() + 7 * 86_400_000)
        .toISOString()
        .slice(0, 10),
      notes: "Cotización comercial inicial.",
      commercialTerms: "Pago y entrega sujetos a confirmación.",
      status: "draft",
      mock: true,
    },
    [
      { productId: products[1].id, quantity: 12, discountPercent: 2 },
      { productId: products[4].id, quantity: 8, discountPercent: 0 },
    ],
    products,
  );

  const reservation: Reservation = {
    id: "demo-reservation-001",
    number: "RES-0001",
    quoteId: seededQuote.id,
    quoteNumber: seededQuote.number,
    sellerId: sellers.manager.id,
    sellerName: sellers.manager.name,
    sellerEmail: sellers.manager.email,
    customer: customers[1],
    items: seededQuote.items.map((item, index) => ({
      ...item,
      reservedQuantity: index === 0 ? item.quantity : item.quantity - 1,
    })),
    status: "partially_reserved",
    createdAt: now,
    expiresAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
    affectedProductIds: [seededQuote.items[1].productId],
    mock: true,
  };

  const confirmedOrder: Order = {
    id: "demo-order-001",
    number: "PED-0001",
    quoteId: seededQuote.id,
    quoteNumber: seededQuote.number,
    reservationId: reservation.id,
    reservationNumber: reservation.number,
    sellerId: sellers.admin.id,
    sellerName: sellers.admin.name,
    sellerEmail: sellers.admin.email,
    customer: customers[2],
    items: seededQuote.items,
    subtotal: seededQuote.subtotal,
    tax: seededQuote.tax,
    total: seededQuote.total,
    currency: "USD",
    status: "confirmed",
    paymentStatus: "paid",
    createdAt: now,
    confirmedAt: now,
    mock: true,
  };

  const receipt: Receipt = {
    id: "demo-receipt-001",
    number: "REC-0001",
    orderId: confirmedOrder.id,
    orderNumber: confirmedOrder.number,
    issuedAt: now,
    order: confirmedOrder,
    verificationReference: "QKS-VERIFY-0001",
    mock: true,
  };

  return {
    products,
    customers,
    quotes: [seededQuote],
    reservations: [reservation],
    orders: [confirmedOrder],
    receipts: [receipt],
    reservationRequests: new Map(),
    orderRequests: new Map(),
    catalogReads: 0,
  };
}

const globalMock = globalThis as typeof globalThis & {
  __quiksolCommerceMock?: MockStore;
};

function store() {
  globalMock.__quiksolCommerceMock ??= buildStore();
  return globalMock.__quiksolCommerceMock;
}

export function resetMockStore() {
  globalMock.__quiksolCommerceMock = buildStore();
  const current = globalMock.__quiksolCommerceMock;
  return {
    products: current.products.length,
    customers: current.customers.length,
    quotes: current.quotes.length,
    reservations: current.reservations.length,
    orders: current.orders.length,
    receipts: current.receipts.length,
    resetAt: new Date().toISOString(),
  };
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculateQuote(
  base: Quote,
  requestedItems: Array<{
    productId: string;
    quantity: number;
    discountPercent?: number;
  }>,
  products: Product[],
) {
  const items = requestedItems.map((input) => {
    const product = products.find((item) => item.id === input.productId);

    if (!product) {
      throw new PlatformApiError(
        404,
        "PRODUCT_NOT_FOUND",
        "Uno de los productos ya no existe.",
      );
    }

    const discountPercent = input.discountPercent || 0;
    const lineSubtotal = roundCurrency(
      product.authorizedUnitPrice *
        input.quantity *
        (1 - discountPercent / 100),
    );

    return {
      productId: product.id,
      mpn: product.mpn,
      description: product.description,
      manufacturer: product.manufacturer,
      quantity: input.quantity,
      authorizedUnitPrice: product.authorizedUnitPrice,
      discountPercent,
      lineSubtotal,
      availabilityRevision: product.availability.revision,
    };
  });
  const subtotal = roundCurrency(
    items.reduce((sum, item) => sum + item.lineSubtotal, 0),
  );
  const tax = roundCurrency(subtotal * base.taxRate);

  return {
    ...base,
    items,
    subtotal,
    tax,
    total: roundCurrency(subtotal + tax),
  };
}

function filterOwned<T extends { sellerId: string }>(
  records: T[],
  session: EmployeeSession,
) {
  return records.filter((record) =>
    canViewSellerRecord(session.role, session.userId, record.sellerId),
  );
}

function updateInventoryStatus(product: Product) {
  const index = Number(product.id.slice(-3)) - 1;
  product.availability.status = availabilityStatus(
    product.availability.availableQuantity,
    index,
  );
}

export function getMockCatalog(
  query: CatalogQuery,
): PaginatedResponse<Product> {
  const parsed = catalogQuerySchema.parse(query);
  const current = store();
  current.catalogReads += 1;

  if (current.catalogReads % 4 === 0) {
    const product = current.products[current.catalogReads % current.products.length];
    product.availability.availableQuantity = Math.max(
      0,
      product.availability.availableQuantity - 1,
    );
    product.availability.revision += 1;
    product.availability.updatedAt = new Date().toISOString();
    updateInventoryStatus(product);
  }

  const normalized = parsed.query?.toLocaleLowerCase();
  let products = current.products.filter(
    (product) =>
      (!normalized ||
        [
          product.mpn,
          product.manufacturer,
          product.description,
          product.category,
        ]
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalized)) &&
      (!parsed.manufacturer ||
        product.manufacturer === parsed.manufacturer) &&
      (!parsed.category || product.category === parsed.category) &&
      (!parsed.status || product.availability.status === parsed.status),
  );

  products = [...products].sort((left, right) => {
    if (parsed.sort === "mpn") return left.mpn.localeCompare(right.mpn);
    if (parsed.sort === "price_asc")
      return left.authorizedUnitPrice - right.authorizedUnitPrice;
    if (parsed.sort === "price_desc")
      return right.authorizedUnitPrice - left.authorizedUnitPrice;
    return (
      right.availability.availableQuantity -
      left.availability.availableQuantity
    );
  });

  const start = (parsed.page - 1) * parsed.pageSize;
  return {
    data: products.slice(start, start + parsed.pageSize),
    page: parsed.page,
    pageSize: parsed.pageSize,
    total: products.length,
    totalPages: Math.max(1, Math.ceil(products.length / parsed.pageSize)),
  };
}

export function getMockProductById(productId: string) {
  const product = store().products.find((item) => item.id === productId);

  if (!product) {
    throw new PlatformApiError(
      404,
      "PRODUCT_NOT_FOUND",
      "Producto no encontrado.",
    );
  }

  return product;
}

export function getMockCustomers(session: EmployeeSession) {
  return store().customers.filter(
    (customer) =>
      session.role !== "employee" || customer.createdBy === session.userId,
  );
}

export function createMockCustomer(
  session: EmployeeSession,
  input: CreateCustomerInput,
) {
  const data = customerInputSchema.parse(input);
  const customer: Customer = {
    ...data,
    id: `demo-customer-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
    createdBy: session.userId,
  };
  store().customers.unshift(customer);
  return customer;
}

export function updateMockCustomer(
  session: EmployeeSession,
  customerId: string,
  input: CreateCustomerInput,
) {
  const current = store();
  const index = current.customers.findIndex((item) => item.id === customerId);
  const customer = current.customers[index];

  if (
    !customer ||
    (session.role === "employee" && customer.createdBy !== session.userId)
  ) {
    throw new PlatformApiError(
      404,
      "CUSTOMER_NOT_FOUND",
      "Cliente no encontrado.",
    );
  }

  current.customers[index] = {
    ...customer,
    ...customerInputSchema.parse(input),
  };
  return current.customers[index];
}

export function createMockQuote(
  session: EmployeeSession,
  input: CreateQuoteInput,
) {
  const parsed = createQuoteInputSchema.parse(input);
  const current = store();
  const customer = current.customers.find(
    (item) => item.id === parsed.customerId,
  );

  if (!customer) {
    throw new PlatformApiError(
      404,
      "CUSTOMER_NOT_FOUND",
      "Selecciona un cliente válido.",
    );
  }

  const maxDiscount = maximumDiscountByRole[session.role];
  if (
    parsed.items.some(
      (item) => (item.discountPercent || 0) > maxDiscount,
    )
  ) {
    throw new PlatformApiError(
      403,
      "DISCOUNT_APPROVAL_REQUIRED",
      `El descuento supera el límite autorizado de ${maxDiscount}%.`,
    );
  }

  const createdAt = new Date().toISOString();
  const sequence = current.quotes.length + 1;
  const quote = calculateQuote(
    {
      id: `demo-quote-${crypto.randomUUID()}`,
      number: `COT-${String(sequence).padStart(4, "0")}`,
      sellerId: session.userId,
      sellerName: session.fullName,
      sellerEmail: session.email,
      sellerRole: session.role,
      customer,
      createdAt,
      updatedAt: createdAt,
      currency: "USD",
      items: [],
      subtotal: 0,
      taxRate: 0.07,
      tax: 0,
      total: 0,
      validUntil: parsed.validUntil,
      notes: parsed.notes,
      commercialTerms:
        parsed.commercialTerms ||
        "Disponibilidad, entrega y pago sujetos a confirmación.",
      status: "draft",
      mock: true,
    },
    parsed.items,
    current.products,
  );

  current.quotes.unshift(quote);
  return quote;
}

export function updateMockQuote(
  session: EmployeeSession,
  quoteId: string,
  input: CreateQuoteInput,
) {
  const current = store();
  const index = current.quotes.findIndex((item) => item.id === quoteId);
  const existing = current.quotes[index];

  if (
    !existing ||
    !canViewSellerRecord(session.role, session.userId, existing.sellerId)
  ) {
    throw new PlatformApiError(404, "QUOTE_NOT_FOUND", "Cotización no encontrada.");
  }

  const replacement = createMockQuote(session, input);
  current.quotes.shift();
  current.quotes[index] = {
    ...replacement,
    id: existing.id,
    number: existing.number,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  return current.quotes[index];
}

export function getMockQuotes(session: EmployeeSession) {
  return filterOwned(store().quotes, session);
}

export function getMockQuote(session: EmployeeSession, quoteId: string) {
  const quote = store().quotes.find((item) => item.id === quoteId);

  if (
    !quote ||
    !canViewSellerRecord(session.role, session.userId, quote.sellerId)
  ) {
    throw new PlatformApiError(404, "QUOTE_NOT_FOUND", "Cotización no encontrada.");
  }

  return quote;
}

export function sendMockQuote(session: EmployeeSession, quoteId: string) {
  const quote = getMockQuote(session, quoteId);
  if (quote.status !== "draft") {
    throw new PlatformApiError(
      422,
      "QUOTE_NOT_SENDABLE",
      "Sólo una cotización en borrador puede enviarse.",
    );
  }
  quote.status = "sent";
  quote.updatedAt = new Date().toISOString();
  return quote;
}

export function requestMockReservation(
  session: EmployeeSession,
  input: RequestReservationInput,
) {
  const parsed = reservationInputSchema.parse(input);
  const current = store();
  const replay = current.reservationRequests.get(parsed.idempotencyKey);
  if (replay) return replay;

  const quote = getMockQuote(session, parsed.quoteId);
  const affected = quote.items.filter((item) => {
    const product = getMockProductById(item.productId);
    return (
      parsed.inventoryRevisions[item.productId] !==
        product.availability.revision ||
      item.quantity > product.availability.availableQuantity
    );
  });

  if (affected.length) {
    throw new PlatformApiError(409, "INVENTORY_CONFLICT", inventoryConflictMessage, {
      affectedProductIds: affected.map((item) => item.productId),
    });
  }

  const createdAt = new Date().toISOString();
  const reservation: Reservation = {
    id: `demo-reservation-${crypto.randomUUID()}`,
    number: `RES-${String(current.reservations.length + 1).padStart(
      4,
      "0",
    )}`,
    quoteId: quote.id,
    quoteNumber: quote.number,
    sellerId: session.userId,
    sellerName: session.fullName,
    sellerEmail: session.email,
    customer: quote.customer,
    items: quote.items.map((item) => ({
      ...item,
      reservedQuantity: item.quantity,
    })),
    status: "active",
    createdAt,
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    affectedProductIds: [],
    mock: true,
  };

  for (const item of quote.items) {
    const product = getMockProductById(item.productId);
    product.availability.availableQuantity -= item.quantity;
    product.availability.revision += 1;
    product.availability.updatedAt = createdAt;
    updateInventoryStatus(product);
  }

  quote.status = "converted_to_reservation";
  quote.updatedAt = createdAt;
  current.reservations.unshift(reservation);
  current.reservationRequests.set(parsed.idempotencyKey, reservation);
  return reservation;
}

export function getMockReservations(session: EmployeeSession) {
  return filterOwned(store().reservations, session);
}

export function getMockReservation(
  session: EmployeeSession,
  reservationId: string,
) {
  const reservation = store().reservations.find(
    (item) => item.id === reservationId,
  );

  if (
    !reservation ||
    !canViewSellerRecord(session.role, session.userId, reservation.sellerId)
  ) {
    throw new PlatformApiError(
      404,
      "RESERVATION_NOT_FOUND",
      "Reserva no encontrada.",
    );
  }

  return reservation;
}

export function cancelMockReservation(
  session: EmployeeSession,
  reservationId: string,
) {
  const reservation = getMockReservation(session, reservationId);

  if (
    reservation.status !== "active" &&
    reservation.status !== "partially_reserved"
  ) {
    throw new PlatformApiError(
      422,
      "RESERVATION_NOT_CANCELLABLE",
      "Esta reserva ya no puede cancelarse.",
    );
  }

  reservation.status = "cancelled";
  for (const item of reservation.items) {
    const product = getMockProductById(item.productId);
    product.availability.availableQuantity += item.reservedQuantity;
    product.availability.revision += 1;
    product.availability.updatedAt = new Date().toISOString();
    updateInventoryStatus(product);
  }

  return reservation;
}

export function confirmMockOrder(
  session: EmployeeSession,
  input: ConfirmOrderInput,
) {
  const parsed = confirmOrderInputSchema.parse(input);
  const current = store();
  const replay = current.orderRequests.get(parsed.idempotencyKey);
  if (replay) return replay;

  const reservation = getMockReservation(session, parsed.reservationId);
  if (reservation.status !== "active") {
    throw new PlatformApiError(
      422,
      "RESERVATION_NOT_ACTIVE",
      "Sólo una reserva activa puede convertirse en pedido.",
    );
  }

  const quote = getMockQuote(session, reservation.quoteId);
  const confirmedAt = new Date().toISOString();
  const order: Order = {
    id: `demo-order-${crypto.randomUUID()}`,
    number: `PED-${String(current.orders.length + 1).padStart(4, "0")}`,
    quoteId: quote.id,
    quoteNumber: quote.number,
    reservationId: reservation.id,
    reservationNumber: reservation.number,
    sellerId: session.userId,
    sellerName: session.fullName,
    sellerEmail: session.email,
    customer: reservation.customer,
    items: reservation.items,
    subtotal: quote.subtotal,
    tax: quote.tax,
    total: quote.total,
    currency: "USD",
    status: "confirmed",
    paymentStatus: "pending",
    createdAt: confirmedAt,
    confirmedAt,
    mock: true,
  };

  reservation.status = "converted_to_order";
  quote.status = "converted_to_order";
  current.orders.unshift(order);
  current.orderRequests.set(parsed.idempotencyKey, order);
  current.receipts.unshift({
    id: `demo-receipt-${crypto.randomUUID()}`,
    number: `REC-${String(current.receipts.length + 1).padStart(4, "0")}`,
    orderId: order.id,
    orderNumber: order.number,
    issuedAt: confirmedAt,
    order,
    verificationReference: `QKS-VERIFY-${crypto
      .randomUUID()
      .slice(0, 8)
      .toUpperCase()}`,
    mock: true,
  });
  return order;
}

export function getMockOrders(session: EmployeeSession) {
  return filterOwned(store().orders, session);
}

export function getMockOrder(session: EmployeeSession, orderId: string) {
  const order = store().orders.find((item) => item.id === orderId);

  if (
    !order ||
    !canViewSellerRecord(session.role, session.userId, order.sellerId)
  ) {
    throw new PlatformApiError(404, "ORDER_NOT_FOUND", "Pedido no encontrado.");
  }

  return order;
}

export function getMockReceipt(session: EmployeeSession, receiptId: string) {
  const receipt = store().receipts.find((item) => item.id === receiptId);

  if (!receipt) {
    throw new PlatformApiError(404, "RECEIPT_NOT_FOUND", "Recibo no encontrado.");
  }

  getMockOrder(session, receipt.orderId);

  if (receipt.order.status !== "confirmed") {
    throw new PlatformApiError(
      422,
      "ORDER_NOT_CONFIRMED",
      "El recibo sólo puede generarse para un pedido confirmado.",
    );
  }

  return receipt;
}

export function getMockReceiptByOrder(
  session: EmployeeSession,
  orderId: string,
) {
  const order = getMockOrder(session, orderId);
  if (order.status !== "confirmed") {
    throw new PlatformApiError(
      422,
      "ORDER_NOT_CONFIRMED",
      "El recibo sólo puede generarse para un pedido confirmado.",
    );
  }
  const receipt = store().receipts.find((item) => item.orderId === orderId);
  if (!receipt) {
    throw new PlatformApiError(404, "RECEIPT_NOT_FOUND", "Recibo no encontrado.");
  }
  return receipt;
}

export function getMockDashboard(
  session: EmployeeSession,
): EmployeeDashboard {
  const quotes = getMockQuotes(session);
  const reservations = getMockReservations(session);
  const orders = getMockOrders(session);
  const lowStock = store().products.filter(
    (product) =>
      product.availability.status === "low_stock" ||
      product.availability.status === "unavailable",
  );

  return {
    session,
    recentQuotes: quotes.slice(0, 4),
    activeReservations: reservations
      .filter(
        (reservation) =>
          reservation.status === "active" ||
          reservation.status === "partially_reserved",
      )
      .slice(0, 4),
    recentOrders: orders.slice(0, 4),
    lowStockProducts: lowStock.slice(0, 5),
    inventoryAlerts: lowStock.slice(0, 3).map((product, index) => ({
      id: `demo-alert-${index + 1}`,
      productId: product.id,
      message: `${product.mpn}: disponibilidad actual ${product.availability.availableQuantity}.`,
      createdAt: product.availability.updatedAt,
    })),
    metrics: {
      quotesThisMonth: quotes.length,
      activeReservations: reservations.filter(
        (item) =>
          item.status === "active" || item.status === "partially_reserved",
      ).length,
      confirmedOrders: orders.filter((item) => item.status === "confirmed")
        .length,
      conversionRate: quotes.length
        ? Math.round((orders.length / quotes.length) * 100)
        : 0,
    },
    platform: {
      mode: "mock",
      label: "Sistema comercial operativo",
      checkedAt: new Date().toISOString(),
    },
  };
}
