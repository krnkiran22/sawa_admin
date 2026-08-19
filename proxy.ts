import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Server-side route guard for the admin panel.
 *
 * Previously access was gated only by a client-side `useEffect` redirect in
 * AdminShell, meaning every route was technically reachable (and briefly
 * rendered) before the redirect fired — a fail-open gate. This middleware runs
 * on the server for every navigation and redirects based on the presence of the
 * `admin_token` cookie (mirrored from the login response), so protected routes
 * never render for an unauthenticated visitor.
 *
 * Note: the cookie only proves a token *exists*. Every admin API call still
 * carries the Bearer token and is validated server-side (role re-checked per
 * request), so an expired/forged cookie yields a 401 → the client clears the
 * session and this guard bounces the user back to /login on the next nav.
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname === "/login";

  if (!token && !isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (token && isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all app routes except Next internals, the API proxy and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
};
