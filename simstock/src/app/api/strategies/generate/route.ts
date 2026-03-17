import { NextRequest, NextResponse } from "next/server";
import { mapAuthError, requireSuperuserRequest } from "@/lib/server/auth";
import { generateStrategyIdeas } from "@/lib/server/simstock-service";

export async function POST(request: NextRequest) {
  try {
    requireSuperuserRequest(request);
    const body = await request.json().catch(() => ({} as { nameHint?: string })) as { nameHint?: string };
    const suggestions = await generateStrategyIdeas({
      nameHint: body.nameHint,
    });
    return NextResponse.json({ suggestions });
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json(
      { error: error instanceof Error ? error.message : "Strategy generation failed" },
      { status: 400 },
    );
  }
}
