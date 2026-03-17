import { NextResponse } from "next/server";
import { mapAuthError, requireSuperuserRequest } from "@/lib/server/auth";
import { copyStrategy } from "@/lib/server/simstock-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireSuperuserRequest(request);
    const { id } = await params;
    const strategies = copyStrategy(id);
    return NextResponse.json(strategies);
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json(
      { error: error instanceof Error ? error.message : "Strategy copy failed" },
      { status: 400 },
    );
  }
}
