import { NextRequest, NextResponse } from "next/server";
import { mapAuthError, requireSuperuserRequest } from "@/lib/server/auth";
import { getDashboardState, updateSettings } from "@/lib/server/simstock-service";

export function GET(request: Request) {
  try {
    requireSuperuserRequest(request);
    return NextResponse.json(getDashboardState().settings);
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json({ error: "Settings read failed" }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    requireSuperuserRequest(request);
    const body = await request.json() as Record<string, unknown>;
    const settings = updateSettings(body);
    return NextResponse.json(settings);
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json(
      { error: error instanceof Error ? error.message : "Settings save failed" },
      { status: 400 },
    );
  }
}
