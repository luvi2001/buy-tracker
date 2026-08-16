import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/orders/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { steps: { orderBy: { stepNumber: "asc" } } },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

// PATCH /api/orders/:id
// Body can include any order field, and/or a `steps` array of
// { stepNumber, status, dateDone } to update individual step progress.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await req.json();
  const { id } = await params;

  const { steps, deadline, ...rest } = body;

  const order = await prisma.order.update({
    where: { id },
    data: {
      ...rest,
      ...(deadline !== undefined
        ? { deadline: deadline ? new Date(deadline) : null }
        : {}),
    },
  });

  if (Array.isArray(steps)) {
    for (const s of steps) {
      await prisma.step.update({
        where: {
          orderId_stepNumber: { orderId: id, stepNumber: s.stepNumber },
        },
        data: {
          status: s.status,
          dateDone: s.dateDone ? new Date(s.dateDone) : s.status === "DONE" ? new Date() : null,
        },
      });
    }
  }

  const updated = await prisma.order.findUnique({
    where: { id: order.id },
    include: { steps: { orderBy: { stepNumber: "asc" } } },
  });

  return NextResponse.json(updated);
}

// DELETE /api/orders/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.order.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
