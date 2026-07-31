import type { EmployeeRole } from "./types";

export type CommercePermission =
  | "catalog:read"
  | "customers:read"
  | "customers:create"
  | "customers:update"
  | "quotes:own"
  | "quotes:team"
  | "quotes:all"
  | "reservations:own"
  | "reservations:team"
  | "reservations:all"
  | "reservations:cancel_team"
  | "orders:own"
  | "orders:team"
  | "orders:all"
  | "discount:employee"
  | "discount:manager"
  | "discount:admin"
  | "stock_alerts:read"
  | "audit:read"
  | "permissions:manage";

const rolePermissions: Record<EmployeeRole, ReadonlySet<CommercePermission>> = {
  employee: new Set([
    "catalog:read",
    "customers:read",
    "customers:create",
    "customers:update",
    "quotes:own",
    "reservations:own",
    "orders:own",
    "discount:employee",
  ]),
  manager: new Set([
    "catalog:read",
    "customers:read",
    "customers:create",
    "customers:update",
    "quotes:own",
    "quotes:team",
    "reservations:own",
    "reservations:team",
    "reservations:cancel_team",
    "orders:own",
    "orders:team",
    "discount:employee",
    "discount:manager",
    "stock_alerts:read",
  ]),
  admin: new Set([
    "catalog:read",
    "customers:read",
    "customers:create",
    "customers:update",
    "quotes:own",
    "quotes:team",
    "quotes:all",
    "reservations:own",
    "reservations:team",
    "reservations:all",
    "reservations:cancel_team",
    "orders:own",
    "orders:team",
    "orders:all",
    "discount:employee",
    "discount:manager",
    "discount:admin",
    "stock_alerts:read",
    "audit:read",
    "permissions:manage",
  ]),
};

export const maximumDiscountByRole: Record<EmployeeRole, number> = {
  employee: 5,
  manager: 12,
  admin: 25,
};

export function can(
  role: EmployeeRole,
  permission: CommercePermission,
): boolean {
  return rolePermissions[role].has(permission);
}

export function requirePermission(
  role: EmployeeRole,
  permission: CommercePermission,
) {
  if (!can(role, permission)) {
    throw new Error(`FORBIDDEN:${permission}`);
  }
}

export function canViewSellerRecord(
  role: EmployeeRole,
  viewerId: string,
  sellerId: string,
) {
  if (role === "admin" || role === "manager") {
    return true;
  }

  return viewerId === sellerId;
}
