import { NextRequest, NextResponse } from "next/server";
import { mapAuthError, requireSuperuserRequest } from "@/lib/server/auth";
import { importSystemData, importSystemDataFromFile } from "@/lib/server/simstock-service";

export async function POST(request: NextRequest) {
  try {
    requireSuperuserRequest(request);
    const body = await request.json() as Record<string, unknown> & { filePath?: string };
    if (typeof body?.filePath === "string" && body.filePath.trim()) {
      return NextResponse.json(importSystemDataFromFile(body.filePath));
    }
    return NextResponse.json(importSystemData(body as Parameters<typeof importSystemData>[0]));
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json(
      { error: error instanceof Error ? error.message : "System import failed" },
      { status: 400 },
    );
  }
}
