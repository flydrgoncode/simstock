import { NextResponse } from "next/server";
import { mapAuthError, requireSuperuserRequest } from "@/lib/server/auth";
import { getDashboardState, refreshIndicesAsync } from "@/lib/server/simstock-service";

export async function POST(request: Request) {
  try {
    requireSuperuserRequest(request);
    await refreshIndicesAsync();
    return NextResponse.json(getDashboardState());
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json(
      { error: error instanceof Error ? error.message : "Index refresh failed" },
      { status: 400 },
    );
  }
}
