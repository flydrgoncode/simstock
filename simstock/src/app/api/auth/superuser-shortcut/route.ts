import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieOptions, loginAsSuperuser } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  try {
    const session = loginAsSuperuser({
      userAgent: request.headers.get("user-agent"),
      ipAddress: request.headers.get("x-forwarded-for"),
    });
    const response = NextResponse.json({
      ok: true,
      user: session.user,
      expiresAt: session.expiresAt,
    });
    response.cookies.set({
      ...getSessionCookieOptions(),
      value: session.token,
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nao foi possivel iniciar a sessao de superuser." },
      { status: 400 },
    );
  }
}
