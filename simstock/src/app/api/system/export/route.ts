import { NextResponse } from "next/server";
import { mapAuthError, requireSuperuserRequest } from "@/lib/server/auth";
import { exportSystemData } from "@/lib/server/simstock-service";

export function GET(request: Request) {
  try {
    requireSuperuserRequest(request);
    return NextResponse.json(exportSystemData());
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json({ error: "Export failed" }, { status: 400 });
  }
}
