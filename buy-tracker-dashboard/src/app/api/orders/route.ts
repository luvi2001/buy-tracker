import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STEP_NAMES } from "@/lib/steps";

export const dynamic = "force-dynamic";

// GET /api/orders - list every order with its 6 steps, newest first
export async function GET() {
  const orders = await prisma.order.findMany({
    include: { steps: { orderBy: { stepNumber: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

// POST /api/orders - create a new order (a new row in the tracker)
// Body: {
//   buyOrderName, responsible, buyQty, totalSO, totalFG, refActiveFG,
//   deadline, overallStatus, remarks
// }
// The 6 steps are created automatically, all PENDING, so the entry
// shows up immediately in the "Active orders per step" breakdown.
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.buyOrderName || typeof body.buyOrderName !== "string") {
    return NextResponse.json(
      { error: "buyOrderName is required" },
      { status: 400 }
    );
  }

  const order = await prisma.order.create({
    data: {
      buyOrderName: body.buyOrderName,
      responsible: body.responsible || null,
      buyQty: Number(body.buyQty) || 0,
      totalSO: Number(body.totalSO) || 0,
      totalFG: Number(body.totalFG) || 0,
      refActiveFG: body.refActiveFG || null,
      deadline: body.deadline ? new Date(body.deadline) : null,
      overallStatus: body.overallStatus || "NOT_STARTED",
      remarks: body.remarks || null,
      steps: {
        create: STEP_NAMES.map((name, i) => ({
          stepNumber: i + 1,
          stepName: name,
          status: "PENDING",
        })),
      },
    },
    include: { steps: { orderBy: { stepNumber: "asc" } } },
  });

  return NextResponse.json(order, { status: 201 });
}
