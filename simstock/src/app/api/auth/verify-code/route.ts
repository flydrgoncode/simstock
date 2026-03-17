import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieOptions, verifyLoginCode } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { email?: string; code?: string };
    const verified = verifyLoginCode(String(body.email ?? ""), String(body.code ?? ""), {
      userAgent: request.headers.get("user-agent"),
      ipAddress: request.headers.get("x-forwarded-for"),
    });
    const response = NextResponse.json({
      ok: true,
      user: verified.user,
      expiresAt: verified.expiresAt,
    });
    response.cookies.set({
      ...getSessionCookieOptions(),
      value: verified.token,
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nao foi possivel validar o codigo." },
      { status: 400 },
    );
  }
}
