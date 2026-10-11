import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/lib/env.public";
import { isLocale, LOCALE_COOKIE, LOCALE_HEADER } from "@/lib/i18n/locale";
import { isOwnerEmail } from "@/lib/owner";
import { isThemeId, THEME_PREVIEW_HEADER, THEME_PREVIEW_PARAM } from "@/lib/themes/themes";

const LOGIN_PATH = "/admin/login";
/** Admin paths served without a session: the login page and the PWA's shell (no data in either). */
const PUBLIC_ADMIN_PATHS = new Set([LOGIN_PATH, "/admin/offline", "/admin/manifest.webmanifest"]);
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Next.js 16 proxy (formerly middleware). Two jobs:
 * 1. `?lang=en|bn` on any page (PW-80, hreflang): the request is rendered in that language and
 *    the cookie is set for the pages after it. It is served, never redirected, so a crawler
 *    (which keeps no cookie) gets Bengali at the Bengali address.
 * 2. `?theme=<id>` (OD-35 preview): forwarded as a request header that only ever comes from a
 *    valid value here (anything the client sent is overwritten or dropped). The public layout
 *    honours it for the signed-in owner only.
 * 3. /admin: refreshes the Supabase session cookie and keeps non-owners out. This is the first
 *    gate only: every admin page and action also calls requireOwner() (src/lib/auth.ts).
 */
export async function proxy(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get("lang");
  const requestedLocale = isLocale(lang) ? lang : null;
  if (requestedLocale) request.headers.set(LOCALE_HEADER, requestedLocale);

  const theme = request.nextUrl.searchParams.get(THEME_PREVIEW_PARAM);
  if (isThemeId(theme)) request.headers.set(THEME_PREVIEW_HEADER, theme);
  else request.headers.delete(THEME_PREVIEW_HEADER);

  let response = NextResponse.next({ request });
  if (requestedLocale) {
    response.cookies.set(LOCALE_COOKIE, requestedLocale, {
      path: "/",
      maxAge: ONE_YEAR,
      sameSite: "lax",
    });
  }

  if (!request.nextUrl.pathname.startsWith("/admin")) return response;

  const supabase = createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        const next = NextResponse.next({ request });
        response.cookies.getAll().forEach((cookie) => next.cookies.set(cookie));
        response = next;
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser() validates the token with Supabase Auth on every admin request. Fine for one owner.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = !!user && isOwnerEmail(user.email);
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === LOGIN_PATH;

  if (!isOwner && !PUBLIC_ADMIN_PATHS.has(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = "";
    url.searchParams.set("next", pathname);
    return withCookies(NextResponse.redirect(url), response);
  }

  if (isOwner && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return withCookies(NextResponse.redirect(url), response);
  }

  return response;
}

/** Carry refreshed session cookies over to a redirect response. */
function withCookies(target: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  return target;
}

export const config = {
  // Pages only: static assets, images, fonts and the image optimizer are left alone.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|fonts/|.*\\.(?:png|jpg|jpeg|webp|svg|ico|mp4|txt|xml)$).*)",
  ],
};
