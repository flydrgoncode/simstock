import { NextResponse } from "next/server";
import { mapAuthError, requireSuperuserRequest } from "@/lib/server/auth";
import { refreshMarketSourceAsync, getDashboardState } from "@/lib/server/simstock-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ assetId: string }> },
) {
  try {
    requireSuperuserRequest(request);
    const { assetId } = await context.params;
    await refreshMarketSourceAsync(assetId);
    return NextResponse.json(getDashboardState());
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json(
      { error: error instanceof Error ? error.message : "Stock item refresh failed" },
      { status: 400 },
    );
  }
}
