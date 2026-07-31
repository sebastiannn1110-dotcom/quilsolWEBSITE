import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { PlatformApiError } from "./errors";
import { employeeLoginSchema } from "./schemas";
import type { EmployeeRole, EmployeeSession } from "./types";

const sessionCookieName = "quiksol_employee_session";

const mockEmployees: Array<{
  userId: string;
  email: string;
  fullName: string;
  role: EmployeeRole;
}> = [
  {
    userId: "employee-admin-demo",
    email: "adminuser1@quiksol.local",
    fullName: "Administrador Quiksol",
    role: "admin",
  },
  {
    userId: "employee-manager-demo",
    email: "manager1@quiksol.local",
    fullName: "Manager Comercial",
    role: "manager",
  },
  {
    userId: "employee-sales-demo",
    email: "empleado1@quiksol.local",
    fullName: "Asesor Comercial",
    role: "employee",
  },
  {
    userId: "employee-sebastian-sales",
    email: "sebastiasc01@gmail.com",
    fullName: "Sebastian C.",
    role: "employee",
  },
];

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function sessionSecret() {
  const secret =
    process.env.EMPLOYEE_SESSION_SECRET ||
    process.env.EMPLOYEE_MOCK_PASSWORD;

  if (!secret || secret.length < 10) {
    throw new PlatformApiError(
      503,
      "AUTH_INTEGRATION_PENDING",
      "Integración de autenticación pendiente.",
    );
  }

  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("base64url");
}

function encodeSession(session: EmployeeSession) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSession(token: string): EmployeeSession | null {
  const [payload, signature] = token.split(".");

  if (!payload || !signature || !safeEqual(sign(payload), signature)) {
    return null;
  }

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as EmployeeSession;

    if (
      !session.userId ||
      !session.email ||
      !["admin", "manager", "employee"].includes(session.role) ||
      new Date(session.expiresAt).getTime() <= Date.now()
    ) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function isEmployeeDemoMode() {
  const configuredMode = process.env.EMPLOYEE_COMMERCE_DEMO_MODE
    ?.trim()
    .toLowerCase();

  return ["true", '"true"', "'true'"].includes(configuredMode || "");
}

export function isEmployeeMockEnabled() {
  return isEmployeeDemoMode();
}

export function employeeAuthMode(): "mock" | "platform" | "pending" {
  if (isEmployeeMockEnabled()) {
    return "mock";
  }

  return process.env.PLATFORM_API_BASE_URL?.startsWith("https://")
    ? "platform"
    : "pending";
}

export function verifyMockEmployeeCredentials(email: string, password: string) {
  const mockPassword = process.env.EMPLOYEE_MOCK_PASSWORD;
  const employee = mockEmployees.find((item) => item.email === email);

  if (!mockPassword || !employee || !safeEqual(password, mockPassword)) {
    throw new PlatformApiError(
      401,
      "INVALID_CREDENTIALS",
      "Usuario o contraseña incorrectos.",
    );
  }

  return employee;
}

async function authenticateWithPlatform(
  input: ReturnType<typeof employeeLoginSchema.parse>,
) {
  const baseUrl = process.env.PLATFORM_API_BASE_URL;

  if (!baseUrl?.startsWith("https://")) {
    throw new PlatformApiError(
      503,
      "AUTH_INTEGRATION_PENDING",
      "Integración de autenticación pendiente.",
    );
  }

  const response = await fetch(
    `${baseUrl.replace(/\/$/, "")}/api/commerce/auth/session`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    },
  );

  if (!response.ok) {
    throw new PlatformApiError(
      response.status,
      response.status === 401 ? "INVALID_CREDENTIALS" : "PLATFORM_AUTH_ERROR",
      response.status === 401
        ? "Usuario o contraseña incorrectos."
        : "No fue posible validar la sesión con la plataforma.",
    );
  }

  const result = (await response.json()) as {
    session: Omit<EmployeeSession, "provider">;
    accessToken?: string;
  };

  if (!result.session?.userId || !result.accessToken) {
    throw new PlatformApiError(
      502,
      "INVALID_PLATFORM_RESPONSE",
      "La plataforma devolvió una sesión inválida.",
    );
  }

  return {
    session: { ...result.session, provider: "platform" as const },
    accessToken: result.accessToken,
  };
}

export async function createEmployeeSession(input: unknown) {
  const parsed = employeeLoginSchema.safeParse(input);

  if (!parsed.success) {
    throw new PlatformApiError(
      400,
      "INVALID_LOGIN",
      "Revisa el usuario y la contraseña.",
    );
  }

  let session: EmployeeSession;
  let accessToken: string | undefined;

  if (isEmployeeMockEnabled()) {
    const employee = verifyMockEmployeeCredentials(
      parsed.data.email,
      parsed.data.password,
    );

    const duration = parsed.data.remember ? 60 * 60 * 24 * 7 : 60 * 60 * 8;
    session = {
      ...employee,
      expiresAt: new Date(Date.now() + duration * 1000).toISOString(),
      provider: "mock",
    };
  } else {
    const platform = await authenticateWithPlatform(parsed.data);
    session = platform.session;
    accessToken = platform.accessToken;
  }

  const cookieStore = await cookies();
  const maxAge = parsed.data.remember ? 60 * 60 * 24 * 7 : 60 * 60 * 8;
  cookieStore.set(sessionCookieName, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });

  if (accessToken) {
    cookieStore.set("quiksol_employee_access", accessToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      path: "/api/employee",
      maxAge,
    });
  }

  return session;
}

export async function getEmployeeSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  return decodeSession(token);
}

export async function requireEmployeeSession() {
  const session = await getEmployeeSession();

  if (!session) {
    throw new PlatformApiError(
      401,
      "SESSION_REQUIRED",
      "Debes iniciar sesión para continuar.",
    );
  }

  return session;
}

export async function getPlatformAccessToken() {
  if (isEmployeeMockEnabled()) {
    return null;
  }

  return (await cookies()).get("quiksol_employee_access")?.value || null;
}

export async function destroyEmployeeSession() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
  cookieStore.delete("quiksol_employee_access");
}
