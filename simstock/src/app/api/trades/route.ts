import { NextRequest, NextResponse } from "next/server";
import { mapAuthError, requireSuperuserRequest } from "@/lib/server/auth";
import { createTrade } from "@/lib/server/simstock-service";

export async function POST(request: NextRequest) {
  try {
    requireSuperuserRequest(request);
    const body = await request.json() as {
      side: "BUY" | "SELL";
      indexId: string;
      amountValue: number;
      amountMode: "EUR" | "LOCAL";
      unitLimitUsd?: number | null;
      validUntil?: string | null;
      source?: "manual" | "rule" | "agent";
      strategyName?: string | null;
    };
    const state = createTrade({
      side: body.side === "SELL" ? "SELL" : "BUY",
      indexId: String(body.indexId ?? ""),
      amountValue: Number(body.amountValue),
      amountMode: body.amountMode === "LOCAL" ? "LOCAL" : "EUR",
      unitLimitUsd: body.unitLimitUsd ? Number(body.unitLimitUsd) : null,
      validUntil: body.validUntil ?? null,
      source: body.source ?? "manual",
      strategyName: body.strategyName ?? null,
    });
    return NextResponse.json(state);
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json(
      { error: error instanceof Error ? error.message : "Trade failed" },
      { status: 400 },
    );
  }
}
