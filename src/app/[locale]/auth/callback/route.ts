import { NextRequest, NextResponse } from "next/server";
import { locales, type Locale } from "@/lib/constants";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function safeResetPath(locale: Locale, requestedPath: string | null) {
  const expectedPath = `/${locale}/reset-password`;
  return requestedPath === expectedPath ? requestedPath : expectedPath;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: requestedLocale } = await params;
  const locale = locales.includes(requestedLocale as Locale)
    ? (requestedLocale as Locale)
    : "es";
  const code = request.nextUrl.searchParams.get("code");
  const nextPath = safeResetPath(
    locale,
    request.nextUrl.searchParams.get("next"),
  );

  if (code) {
    const supabase = await createServerSupabaseClient();

    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        return NextResponse.redirect(new URL(nextPath, request.url));
      }
    }
  }

  const errorUrl = new URL(`/${locale}/forgot-password`, request.url);
  errorUrl.searchParams.set(
    "message",
    locale === "es"
      ? "El enlace de recuperación no es válido o venció."
      : "The recovery link is invalid or has expired.",
  );

  return NextResponse.redirect(errorUrl);
}
