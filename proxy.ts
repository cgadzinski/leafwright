import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isMerchant } from "@/lib/auth/callbacks";

/**
 * `/admin/**` is for merchant roles; `/account/**` is for any signed-in user. Guests can
 * still check out, so nothing under the storefront is guarded.
 */
export const proxy = auth((request) => {
  const { pathname, search } = request.nextUrl;
  const session = request.auth;

  if (!session?.user) {
    const signIn = new URL("/sign-in", request.nextUrl.origin);
    signIn.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(signIn);
  }

  if (pathname.startsWith("/admin") && !isMerchant(session.user.role)) {
    return NextResponse.redirect(new URL("/", request.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
