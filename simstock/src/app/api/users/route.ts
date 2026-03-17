import { NextRequest, NextResponse } from "next/server";
import { mapAuthError, requireSuperuserRequest } from "@/lib/server/auth";
import { createUser } from "@/lib/server/simstock-service";

export async function POST(request: NextRequest) {
  try {
    requireSuperuserRequest(request);
    const body = await request.json() as { name?: string; email?: string; role?: "view_only" | "superuser" };
    return NextResponse.json(createUser(
      String(body.name ?? ""),
      String(body.email ?? ""),
      body.role === "view_only" ? "view_only" : "superuser",
    ));
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json(
      { error: error instanceof Error ? error.message : "User create failed" },
      { status: 400 },
    );
  }
}
