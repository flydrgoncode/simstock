import { NextRequest, NextResponse } from "next/server";
import { mapAuthError, requireSuperuserRequest } from "@/lib/server/auth";
import { deleteAgent } from "@/lib/server/simstock-service";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireSuperuserRequest(_request);
    const { id } = await params;
    return NextResponse.json(deleteAgent(id));
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json(
      { error: error instanceof Error ? error.message : "Agent delete failed" },
      { status: 400 },
    );
  }
}
