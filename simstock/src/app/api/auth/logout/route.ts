import { NextRequest, NextResponse } from "next/server";
import { clearSessionByToken, getSessionCookieOptions } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  clearSessionByToken(request.cookies.get(getSessionCookieOptions().name)?.value ?? null);
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    ...getSessionCookieOptions(),
    value: "",
    maxAge: 0,
  });
  return response;
}
