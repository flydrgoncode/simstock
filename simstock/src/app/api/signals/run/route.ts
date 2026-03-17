import { NextResponse } from "next/server";
import { mapAuthError, requireSuperuserRequest } from "@/lib/server/auth";
import { runSignalEngine } from "@/lib/server/simstock-service";

export async function POST(request: Request) {
  try {
    requireSuperuserRequest(request);
    return NextResponse.json(await runSignalEngine());
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json(
      { error: error instanceof Error ? error.message : "Signal engine failed" },
      { status: 400 },
    );
  }
}
