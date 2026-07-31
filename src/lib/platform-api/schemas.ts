import { z } from "zod";

const cleanText = (minimum: number, maximum: number) =>
  z.string().trim().min(minimum).max(maximum);

export const employeeLoginSchema = z.object({
  email: z.string().trim().email().max(180).toLowerCase(),
  password: z.string().min(8).max(200),
  remember: z.boolean().optional().default(false),
});

export const customerInputSchema = z.object({
  companyOrName: cleanText(2, 160),
  contact: cleanText(2, 120),
  email: z.string().trim().email().max(180).toLowerCase(),
  phone: cleanText(5, 30),
  country: cleanText(2, 100),
  city: cleanText(2, 100),
  address: cleanText(4, 240),
  taxId: z.string().trim().max(80).optional().default(""),
  preferredLanguage: z.enum(["es", "en"]),
  commercialNotes: z.string().trim().max(1000).optional().default(""),
});

export const quoteItemInputSchema = z.object({
  productId: cleanText(1, 100),
  quantity: z.number().int().min(1).max(100_000),
  discountPercent: z.number().min(0).max(100).optional().default(0),
});

export const createQuoteInputSchema = z.object({
  customerId: cleanText(1, 100),
  items: z.array(quoteItemInputSchema).min(1).max(100),
  validUntil: z.iso.date(),
  notes: z.string().trim().max(2000).optional().default(""),
  commercialTerms: z.string().trim().max(3000).optional().default(""),
});

export const reservationInputSchema = z.object({
  quoteId: cleanText(1, 100),
  inventoryRevisions: z.record(z.string(), z.number().int().nonnegative()),
  idempotencyKey: z.uuid(),
});

export const confirmOrderInputSchema = z.object({
  reservationId: cleanText(1, 100),
  idempotencyKey: z.uuid(),
});

export const catalogQuerySchema = z.object({
  query: z.string().trim().max(120).optional(),
  manufacturer: z.string().trim().max(120).optional(),
  category: z.string().trim().max(120).optional(),
  status: z
    .enum([
      "available",
      "low_stock",
      "partially_reserved",
      "temporarily_reserved",
      "unavailable",
      "updating",
    ])
    .optional(),
  sort: z
    .enum(["availability", "mpn", "price_asc", "price_desc"])
    .optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(24),
});
