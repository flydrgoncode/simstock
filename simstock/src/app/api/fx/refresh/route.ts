import { NextResponse } from "next/server";
import { mapAuthError, requireSuperuserRequest } from "@/lib/server/auth";
import { refreshFxRatesAsync } from "@/lib/server/simstock-service";

export async function POST(request: Request) {
  try {
    requireSuperuserRequest(request);
    const state = await refreshFxRatesAsync();
    return NextResponse.json(state);
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json(
      { error: error instanceof Error ? error.message : "FX refresh failed" },
      { status: 500 },
    );
  }
}
