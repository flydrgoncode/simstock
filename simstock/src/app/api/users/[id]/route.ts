import { NextResponse } from "next/server";
import { mapAuthError, requireSuperuserRequest } from "@/lib/server/auth";
import { deleteUser, updateUser } from "@/lib/server/simstock-service";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireSuperuserRequest(request);
    const body = await request.json() as { name?: string; email?: string; role?: "view_only" | "superuser" };
    const { id } = await context.params;
    return NextResponse.json(updateUser(id, {
      name: String(body.name ?? ""),
      email: String(body.email ?? ""),
      role: body.role === "view_only" ? "view_only" : "superuser",
    }));
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json(
      { error: error instanceof Error ? error.message : "User update failed" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireSuperuserRequest(request);
    const { id } = await context.params;
    return NextResponse.json(deleteUser(id));
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json(
      { error: error instanceof Error ? error.message : "User delete failed" },
      { status: 400 },
    );
  }
}
