import { NextRequest, NextResponse } from "next/server";
import { locales, type Locale } from "@/lib/constants";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function safeResetPath(locale: Locale, requestedPath: string | null) {
  const expectedPath = `/${locale}/reset-password`;
  return requestedPath === expectedPath ? requestedPath : expectedPath;
}

function publicRequestOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProtocol = request.headers.get("x-forwarded-proto");
  const isInternalHost = (host: string) =>
    host.startsWith("localhost") || host.startsWith("127.0.0.1");

  if (forwardedHost && !isInternalHost(forwardedHost)) {
    return `${forwardedProtocol || "https"}://${forwardedHost}`;
  }

  if (!isInternalHost(request.nextUrl.host)) {
    return request.nextUrl.origin;
  }

  return "https://quiksol-web.onrender.com";
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
  const publicOrigin = publicRequestOrigin(request);

  if (code) {
    const supabase = await createServerSupabaseClient();

    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        return NextResponse.redirect(new URL(nextPath, publicOrigin));
      }
    }
  }

  const errorUrl = new URL(`/${locale}/forgot-password`, publicOrigin);
  errorUrl.searchParams.set(
    "message",
    locale === "es"
      ? "El enlace de recuperación no es válido o venció."
      : "The recovery link is invalid or has expired.",
  );

  return NextResponse.redirect(errorUrl);
}
