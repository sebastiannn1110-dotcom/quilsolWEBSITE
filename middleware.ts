import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./src/i18n/routing";

const intlMiddleware = createMiddleware(routing);

function requiresSessionRefresh(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const area = segments[1];

  return area === "admin" || area === "portal";
}

function hasSupabaseSessionCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"));
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

export default async function middleware(request: NextRequest) {
  const recoveryCode = request.nextUrl.searchParams.get("code");

  if (request.nextUrl.pathname === "/" && recoveryCode) {
    const recoveryUrl = new URL(
      "/es/auth/callback",
      publicRequestOrigin(request),
    );
    recoveryUrl.search = request.nextUrl.search;
    recoveryUrl.searchParams.set("next", "/es/reset-password");

    return NextResponse.redirect(recoveryUrl);
  }

  const response = intlMiddleware(request);

  // Public pages never read the session. Avoid an external Supabase round trip
  // before rendering every catalog, product and marketing navigation.
  if (
    !requiresSessionRefresh(request.nextUrl.pathname) ||
    !hasSupabaseSessionCookie(request)
  ) {
    return response;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url?.startsWith("https://") || !publicKey?.trim()) {
    return response;
  }

  const supabaseResponse =
    response instanceof NextResponse ? response : NextResponse.next();

  const supabase = createServerClient(url, publicKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: ["/", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
