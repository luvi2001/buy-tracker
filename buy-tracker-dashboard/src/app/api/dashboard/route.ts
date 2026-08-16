import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STEP_NAMES } from "@/lib/steps";

export const dynamic = "force-dynamic";

// GET /api/dashboard - the numbers behind the DASHBOARD sheet:
// totals, status breakdown, active orders per step, items needing attention.
export async function GET() {
  const orders = await prisma.order.findMany({
    include: { steps: { orderBy: { stepNumber: "asc" } } },
  });

  type StatusKey = "COMPLETE" | "IN_PROGRESS" | "BLOCKED" | "NOT_STARTED" | "OVERDUE";
  type StepRow = { stepNumber: number; stepName: string; status: string };
  type OrderRow = (typeof orders)[number];

  const totalBuys = orders.length;
  const totalQty = orders.reduce((sum: number, o: OrderRow) => sum + o.buyQty, 0);

  const statusBreakdown: Record<StatusKey, number> = {
    COMPLETE: 0,
    IN_PROGRESS: 0,
    BLOCKED: 0,
    NOT_STARTED: 0,
    OVERDUE: 0,
  };
  for (const o of orders) statusBreakdown[o.overallStatus as StatusKey]++;

  // "Active" at a step = that step is IN_PROGRESS or PENDING while the
  // order itself isn't COMPLETE (mirrors "orders active" per step in the sheet)
  const activePerStep = STEP_NAMES.map((name, i) => {
    const stepNumber = i + 1;
    const count = orders.filter((o: OrderRow) => {
      if (o.overallStatus === "COMPLETE") return false;
      const step = o.steps.find((s: StepRow) => s.stepNumber === stepNumber);
      return step && step.status !== "DONE";
    }).length;
    return { stepNumber, name, count };
  });

  const needsAttention = orders
    .filter((o: OrderRow) => o.overallStatus === "BLOCKED" || o.overallStatus === "OVERDUE")
    .map((o: OrderRow) => {
      const blockedStep = o.steps.find((s: StepRow) => s.status === "BLOCKED");
      return {
        id: o.id,
        buyOrderName: o.buyOrderName,
        atStep: blockedStep ? `${blockedStep.stepNumber}. ${blockedStep.stepName}` : "-",
        status: o.overallStatus,
      };
    });

  return NextResponse.json({
    totalBuys,
    totalQty,
    statusBreakdown,
    activePerStep,
    needsAttention,
  });
}
