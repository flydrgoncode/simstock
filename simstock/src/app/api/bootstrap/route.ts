import { NextResponse } from "next/server";
import { mapAuthError, requireAuthenticatedRequest } from "@/lib/server/auth";
import { getDashboardState, primeMarketDataAsync } from "@/lib/server/simstock-service";

export async function GET(request: Request) {
  try {
    requireAuthenticatedRequest(request);
    await primeMarketDataAsync();
    return NextResponse.json(getDashboardState());
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json({ error: "Bootstrap failed" }, { status: 400 });
  }
}
