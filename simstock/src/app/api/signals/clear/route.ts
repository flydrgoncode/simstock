import { NextResponse } from "next/server";
import { mapAuthError, requireSuperuserRequest } from "@/lib/server/auth";
import { clearSignals } from "@/lib/server/simstock-service";

export async function POST(request: Request) {
  try {
    requireSuperuserRequest(request);
    return NextResponse.json(clearSignals());
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json(
      { error: error instanceof Error ? error.message : "Signal clear failed" },
      { status: 400 },
    );
  }
}
