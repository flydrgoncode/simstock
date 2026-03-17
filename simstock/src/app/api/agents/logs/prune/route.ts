import { NextResponse } from "next/server";
import { mapAuthError, requireSuperuserRequest } from "@/lib/server/auth";
import { pruneInactiveAgentLogs } from "@/lib/server/simstock-service";

export async function POST(request: Request) {
  try {
    requireSuperuserRequest(request);
    return NextResponse.json(pruneInactiveAgentLogs());
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json(
      { error: error instanceof Error ? error.message : "Agent log cleanup failed" },
      { status: 400 },
    );
  }
}
