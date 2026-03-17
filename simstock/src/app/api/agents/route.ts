import { NextRequest, NextResponse } from "next/server";
import { mapAuthError, requireSuperuserRequest } from "@/lib/server/auth";
import { createAgent, getDashboardState } from "@/lib/server/simstock-service";

export function GET(request: Request) {
  try {
    requireSuperuserRequest(request);
    return NextResponse.json(getDashboardState().agents);
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json({ error: "Agent read failed" }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    requireSuperuserRequest(request);
    const body = await request.json() as {
      name?: string;
      strategyId?: string;
      budgetEur?: number;
      executionMode?: string;
      executionHours?: number;
    };
    const agents = createAgent({
      name: String(body.name ?? ""),
      strategyId: String(body.strategyId ?? ""),
      budgetEur: Number(body.budgetEur),
      executionMode: body.executionMode ?? "market_open",
      executionHours: Number(body.executionHours ?? 6),
    });
    return NextResponse.json(agents);
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json(
      { error: error instanceof Error ? error.message : "Agent creation failed" },
      { status: 400 },
    );
  }
}
