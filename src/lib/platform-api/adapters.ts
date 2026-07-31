import { PlatformApiError } from "./errors";

const prohibitedFinancialFields = new Set([
  "cost",
  "internalCost",
  "supplierCost",
  "purchasePrice",
  "gp",
  "grossProfit",
  "margin",
  "supplierPrice",
]);

export function assertNoProhibitedFinancialFields(
  value: unknown,
  path = "response",
) {
  if (!value || typeof value !== "object") return;

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoProhibitedFinancialFields(item, `${path}[${index}]`),
    );
    return;
  }

  for (const [key, nested] of Object.entries(value)) {
    if (prohibitedFinancialFields.has(key)) {
      throw new PlatformApiError(
        502,
        "PROHIBITED_FIELD",
        "La plataforma devolvió un campo financiero no permitido.",
        { path: `${path}.${key}` },
      );
    }
    assertNoProhibitedFinancialFields(nested, `${path}.${key}`);
  }
}

export function adaptPlatformResponse<T>(value: T): T {
  assertNoProhibitedFinancialFields(value);
  return value;
}
