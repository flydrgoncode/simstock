import { NextRequest, NextResponse } from "next/server";
import { mapAuthError, requireSuperuserRequest } from "@/lib/server/auth";
import { deleteStrategy, setStrategyActive, updateStrategy } from "@/lib/server/simstock-service";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireSuperuserRequest(request);
    const body = await request.json() as Record<string, unknown>;
    const { id } = await params;
    const strategies = updateStrategy(id, body);
    return NextResponse.json(strategies);
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json(
      { error: error instanceof Error ? error.message : "Strategy update failed" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireSuperuserRequest(request);
    const { id } = await params;
    return NextResponse.json(deleteStrategy(id));
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json(
      { error: error instanceof Error ? error.message : "Strategy delete failed" },
      { status: 400 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireSuperuserRequest(request);
    const body = await request.json() as { active?: boolean };
    const { id } = await params;
    return NextResponse.json(setStrategyActive(id, Boolean(body.active)));
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json(
      { error: error instanceof Error ? error.message : "Strategy toggle failed" },
      { status: 400 },
    );
  }
}
