import { NextRequest, NextResponse } from "next/server";
import { mapAuthError, requireSuperuserRequest } from "@/lib/server/auth";
import { selectUser } from "@/lib/server/simstock-service";

export async function POST(request: NextRequest) {
  try {
    requireSuperuserRequest(request);
    const body = await request.json() as { userId?: string };
    return NextResponse.json(selectUser(String(body.userId ?? "")));
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json(
      { error: error instanceof Error ? error.message : "User switch failed" },
      { status: 400 },
    );
  }
}
