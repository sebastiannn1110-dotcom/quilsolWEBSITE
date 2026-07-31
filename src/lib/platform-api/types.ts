export type EmployeeRole = "admin" | "manager" | "employee";

export type EmployeeSession = {
  userId: string;
  email: string;
  fullName: string;
  role: EmployeeRole;
  expiresAt: string;
  provider: "mock" | "platform";
};

export type InventoryStatus =
  | "available"
  | "low_stock"
  | "partially_reserved"
  | "temporarily_reserved"
  | "unavailable"
  | "updating";

export type InventoryAvailability = {
  availableQuantity: number;
  status: InventoryStatus;
  updatedAt: string;
  revision: number;
};

export type Product = {
  id: string;
  mpn: string;
  manufacturer: string;
  description: string;
  category: string;
  imageUrl: string | null;
  authorizedUnitPrice: number;
  currency: "USD";
  minimumOrderQuantity: number;
  availability: InventoryAvailability;
};

export type Customer = {
  id: string;
  companyOrName: string;
  legalCompanyName?: string;
  contact: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  addressLine2?: string;
  stateOrProvince: string;
  postalCode: string;
  deliveryRecipient: string;
  deliveryPhone: string;
  deliveryEmail: string;
  taxId?: string;
  purchaseOrderReference?: string;
  preferredLanguage: "es" | "en" | "zh";
  commercialNotes?: string;
  createdAt: string;
  createdBy: string;
};

export type QuoteStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired"
  | "converted_to_reservation"
  | "converted_to_order";

export type QuoteItem = {
  productId: string;
  mpn: string;
  description: string;
  manufacturer: string;
  quantity: number;
  authorizedUnitPrice: number;
  discountPercent: number;
  lineSubtotal: number;
  availabilityRevision: number;
};

export type Quote = {
  id: string;
  number: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  sellerRole: EmployeeRole;
  customer: Customer;
  createdAt: string;
  updatedAt: string;
  currency: "USD";
  items: QuoteItem[];
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  validUntil: string;
  notes: string;
  commercialTerms: string;
  status: QuoteStatus;
  mock: boolean;
};

export type ReservationStatus =
  | "pending"
  | "active"
  | "partially_reserved"
  | "expired"
  | "cancelled"
  | "converted_to_order";

export type ReservationItem = QuoteItem & {
  reservedQuantity: number;
};

export type Reservation = {
  id: string;
  number: string;
  quoteId: string;
  quoteNumber: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  customer: Customer;
  items: ReservationItem[];
  status: ReservationStatus;
  createdAt: string;
  expiresAt: string;
  affectedProductIds: string[];
  mock: boolean;
};

export type OrderStatus =
  | "pending_confirmation"
  | "confirmed"
  | "fulfilled"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "pending" | "paid" | "refunded";

export type OrderItem = QuoteItem;

export type Order = {
  id: string;
  number: string;
  quoteId: string;
  quoteNumber: string;
  reservationId: string;
  reservationNumber: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  customer: Customer;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: "USD";
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  confirmedAt?: string;
  mock: boolean;
};

export type Receipt = {
  id: string;
  number: string;
  orderId: string;
  orderNumber: string;
  issuedAt: string;
  order: Order;
  verificationReference: string;
  mock: boolean;
};

export type PaginatedResponse<T> = {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type EmployeeDashboard = {
  session: EmployeeSession;
  recentQuotes: Quote[];
  activeReservations: Reservation[];
  recentOrders: Order[];
  lowStockProducts: Product[];
  inventoryAlerts: Array<{
    id: string;
    productId: string;
    message: string;
    createdAt: string;
  }>;
  metrics: {
    quotesThisMonth: number;
    activeReservations: number;
    confirmedOrders: number;
    conversionRate: number;
  };
  platform: {
    mode: "mock" | "connected" | "pending";
    label: string;
    checkedAt: string;
  };
};

export type CatalogQuery = {
  query?: string;
  manufacturer?: string;
  category?: string;
  status?: InventoryStatus;
  sort?: "availability" | "mpn" | "price_asc" | "price_desc";
  page?: number;
  pageSize?: number;
};

export type CreateCustomerInput = Omit<
  Customer,
  "id" | "createdAt" | "createdBy"
>;

export type QuoteItemInput = {
  productId: string;
  quantity: number;
  discountPercent?: number;
};

export type CreateQuoteInput = {
  customerId: string;
  items: QuoteItemInput[];
  validUntil: string;
  notes?: string;
  commercialTerms?: string;
};

export type RequestReservationInput = {
  quoteId: string;
  inventoryRevisions: Record<string, number>;
  idempotencyKey: string;
};

export type ConfirmOrderInput = {
  reservationId: string;
  idempotencyKey: string;
};

export type ApiErrorPayload = {
  error: {
    code: string;
    message: string;
    status: number;
    details?: unknown;
  };
};
