"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { locales, type Locale } from "@/lib/constants";

const emailSchema = z.string().trim().email().max(180).toLowerCase();

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(200),
  locale: z.enum(locales),
});

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: emailSchema,
  password: z.string().min(8).max(200),
  companyName: z.string().trim().max(160).optional(),
  country: z.string().trim().max(100).optional(),
  terms: z.literal("on"),
  locale: z.enum(locales),
});

const forgotSchema = z.object({
  email: emailSchema,
  locale: z.enum(locales),
});

const resetSchema = z.object({
  password: z.string().min(8).max(200),
  locale: z.enum(locales),
});

function redirectWithMessage(locale: Locale, path: string, message: string): never {
  redirect(`/${locale}${path}?message=${encodeURIComponent(message)}`);
}

async function requestOrigin() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");

  if (origin?.startsWith("https://") || origin?.startsWith("http://localhost")) {
    return origin.replace(/\/$/, "");
  }

  const host =
    requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");

  if (host) {
    const protocol =
      requestHeaders.get("x-forwarded-proto") ||
      (host.startsWith("localhost") ? "http" : "https");

    return `${protocol}://${host}`;
  }

  return (process.env.NEXT_PUBLIC_SITE_URL || "https://quiksol-web.onrender.com")
    .replace(/\/$/, "");
}

function adminBootstrapEmails() {
  return (process.env.ADMIN_BOOTSTRAP_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

async function bootstrapAdminIfAllowed(userId: string, email?: string | null) {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !adminBootstrapEmails().includes(normalizedEmail)) {
    return;
  }

  const admin = createAdminSupabaseClient();

  if (!admin) {
    return;
  }

  const { data: userResult } = await admin.auth.admin.getUserById(userId);
  const user = userResult.user;

  if (!user?.email_confirmed_at) {
    return;
  }

  await admin
    .from("profiles")
    .update({ role: "super_admin", status: "active" })
    .eq("id", userId);

  await admin.from("admin_audit_logs").insert({
    actor_id: userId,
    action: "role_changed",
    entity_type: "profiles",
    entity_id: userId,
    metadata: { role: "super_admin", reason: "ADMIN_BOOTSTRAP_EMAILS" },
  });
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData.entries()));
  const locale = (formData.get("locale") || "en") as Locale;

  if (!parsed.success) {
    redirectWithMessage(locale, "/login", "Invalid login data.");
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirectWithMessage(parsed.data.locale, "/login", "Supabase is not configured.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    redirectWithMessage(parsed.data.locale, "/login", "Invalid email or password.");
  }

  await bootstrapAdminIfAllowed(data.user.id, data.user.email);
  redirect(`/${parsed.data.locale}/portal`);
}

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData.entries()));
  const locale = (formData.get("locale") || "en") as Locale;

  if (!parsed.success) {
    redirectWithMessage(locale, "/register", "Invalid registration data.");
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirectWithMessage(parsed.data.locale, "/register", "Supabase is not configured.");
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        company_name: parsed.data.companyName || "",
        country: parsed.data.country || "",
        role: "customer",
      },
    },
  });

  if (error) {
    redirectWithMessage(parsed.data.locale, "/register", "Registration could not be completed.");
  }

  if (data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      email: parsed.data.email,
      full_name: parsed.data.fullName,
      company_name: parsed.data.companyName || null,
      country: parsed.data.country || null,
      preferred_locale: parsed.data.locale,
      role: "customer",
      status: "active",
    });
  }

  redirectWithMessage(parsed.data.locale, "/login", "Check your email to verify your account.");
}

export async function forgotPasswordAction(formData: FormData) {
  const parsed = forgotSchema.safeParse(Object.fromEntries(formData.entries()));
  const locale = (formData.get("locale") || "en") as Locale;

  if (!parsed.success) {
    redirectWithMessage(locale, "/forgot-password", "Invalid email.");
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirectWithMessage(parsed.data.locale, "/forgot-password", "Supabase is not configured.");
  }

  const origin = await requestOrigin();
  const nextPath = `/${parsed.data.locale}/reset-password`;
  const callbackUrl = new URL(`/${parsed.data.locale}/auth/callback`, origin);
  callbackUrl.searchParams.set("next", nextPath);

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: callbackUrl.toString(),
  });

  redirectWithMessage(parsed.data.locale, "/login", "Password reset email sent.");
}

export async function resetPasswordAction(formData: FormData) {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData.entries()));
  const locale = (formData.get("locale") || "en") as Locale;

  if (!parsed.success) {
    redirectWithMessage(locale, "/reset-password", "Password must be at least 8 characters.");
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirectWithMessage(parsed.data.locale, "/reset-password", "Supabase is not configured.");
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    redirectWithMessage(parsed.data.locale, "/reset-password", "Password could not be updated.");
  }

  redirect(`/${parsed.data.locale}/portal`);
}

export async function logoutAction(formData: FormData) {
  const locale = (formData.get("locale") || "en") as Locale;
  const supabase = await createServerSupabaseClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect(`/${locale}/login`);
}
