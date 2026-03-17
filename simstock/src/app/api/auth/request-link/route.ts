import { NextRequest, NextResponse } from "next/server";
import { issueMagicLink } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { email?: string };
    const payload = await issueMagicLink(String(body.email ?? ""));
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nao foi possivel iniciar o login por link." },
      { status: 400 },
    );
  }
}
