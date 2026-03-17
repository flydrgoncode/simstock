import { NextRequest, NextResponse } from "next/server";
import { mapAuthError, requireSuperuserRequest } from "@/lib/server/auth";
import { testLlmProfile } from "@/lib/server/simstock-service";

export async function POST(request: NextRequest) {
  try {
    requireSuperuserRequest(request);
    const body = await request.json() as { profileId: string; prompt?: string };
    return NextResponse.json(
      await testLlmProfile(String(body.profileId ?? ""), body.prompt ?? "Resume o contexto atual da carteira em uma frase."),
    );
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json(
      { error: error instanceof Error ? error.message : "LLM test failed" },
      { status: 400 },
    );
  }
}
