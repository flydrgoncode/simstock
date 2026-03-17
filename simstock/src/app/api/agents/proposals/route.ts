import { NextRequest, NextResponse } from "next/server";
import { mapAuthError, requireSuperuserRequest } from "@/lib/server/auth";
import { approveAgentTradeProposal, rejectAgentTradeProposal } from "@/lib/server/simstock-service";

export async function POST(request: NextRequest) {
  try {
    requireSuperuserRequest(request);
    const body = await request.json() as {
      agentId: string;
      proposalId: string;
      decision: "approve" | "reject";
    };
    const decision = body.decision === "approve" ? "approve" : "reject";
    const agentId = String(body.agentId ?? "");
    const proposalId = String(body.proposalId ?? "");
    const state = decision === "approve"
      ? await approveAgentTradeProposal(agentId, proposalId)
      : await rejectAgentTradeProposal(agentId, proposalId);
    return NextResponse.json(state);
  } catch (error) {
    return mapAuthError(error) ?? NextResponse.json(
      { error: error instanceof Error ? error.message : "Agent proposal decision failed" },
      { status: 400 },
    );
  }
}
