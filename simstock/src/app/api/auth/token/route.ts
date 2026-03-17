import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieOptions, verifyMagicLinkToken } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  try {
    const verified = verifyMagicLinkToken(token, {
      userAgent: request.headers.get("user-agent"),
      ipAddress: request.headers.get("x-forwarded-for"),
    });
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set({
      ...getSessionCookieOptions(),
      value: verified.token,
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/?auth=invalid-token", request.url));
  }
}
