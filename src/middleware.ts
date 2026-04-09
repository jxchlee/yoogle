import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  isLogoTheme,
  LOGO_THEME_COOKIE,
  pickLogoTheme,
} from "@/lib/logo-theme";

export function middleware(request: NextRequest) {
  const existingTheme = request.cookies.get(LOGO_THEME_COOKIE)?.value;
  const logoTheme = isLogoTheme(existingTheme) ? existingTheme : pickLogoTheme();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-yougle-logo-theme", logoTheme);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (!isLogoTheme(existingTheme)) {
    response.cookies.set(LOGO_THEME_COOKIE, logoTheme, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
    });
  }

  return response;
}

export const config = {
  matcher: ["/", "/watch/:path*"],
};
