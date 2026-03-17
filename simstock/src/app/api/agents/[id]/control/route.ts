import { NextRequest, NextResponse } from "next/server";
import { mapAuthError, requireSuperuserRequest } from "@/lib/server/auth";
import { controlAgent } from "@/lib/server/simstock-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireSuperuserRequest(request);
    const body = await request.json() as { action: "start" | "pause" | "cancel" };
    const { id } = await params;
    const action = body.action === "pause" || body.action === "cancel" ? body.action : "start";
    const state = await controlAgent(id, action);
    return NextResponse.json(state);
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json(
      { error: error instanceof Error ? error.message : "Agent action failed" },
      { status: 400 },
    );
  }
}
