import { NextRequest, NextResponse } from "next/server";
import { mapAuthError, requireSuperuserRequest } from "@/lib/server/auth";
import { createStrategy, getDashboardState } from "@/lib/server/simstock-service";

export function GET(request: Request) {
  try {
    requireSuperuserRequest(request);
    return NextResponse.json(getDashboardState().strategies);
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json({ error: "Strategy read failed" }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    requireSuperuserRequest(request);
    const body = await request.json() as {
      name?: string;
      source?: "manual" | "generated";
      buyCriteria?: string;
      sellCriteria?: string;
      strategyBrief?: string;
    };
    const strategies = createStrategy({
      name: String(body.name ?? ""),
      source: body.source,
      buyCriteria: String(body.buyCriteria ?? ""),
      sellCriteria: String(body.sellCriteria ?? ""),
      strategyBrief: String(body.strategyBrief ?? ""),
    });
    return NextResponse.json(strategies);
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json(
      { error: error instanceof Error ? error.message : "Strategy creation failed" },
      { status: 400 },
    );
  }
}
