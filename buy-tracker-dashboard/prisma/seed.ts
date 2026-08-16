import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// The 6 fixed steps, in order - matches the TRACKER sheet column groups
export const STEP_NAMES = [
  "ACTIVE SO & FG CREATION",
  "BOM CREATION",
  "SMV UPDATE",
  "PLANT EXT & CODE CHANGE",
  "CR RELEASE",
  "PO",
];

async function main() {
  const sample = [
    {
      buyOrderName: "SE GYMSHARK – SS26 Soft Sculpt Re-buy – Shadowline",
      responsible: "Kishori",
      buyQty: 7713,
      totalSO: 4,
      totalFG: 1,
      refActiveFG: "7001473758",
      deadline: new Date("2026-04-30"),
      overallStatus: "COMPLETE" as const,
      remarks: "SMV follow-up done. Currently at Step 4.",
      stepStatuses: ["DONE", "DONE", "DONE", "DONE", "DONE", "DONE"],
    },
    {
      buyOrderName: "LULU – Sleekline – 6FA – Add Qtys",
      responsible: "Nadeesha",
      buyQty: 1709,
      totalSO: 9,
      totalFG: 4,
      refActiveFG: "7001452177",
      deadline: new Date("2026-03-23"),
      overallStatus: "IN_PROGRESS" as const,
      remarks: "Active SO & FG DONE. BOM processing.",
      stepStatuses: ["DONE", "IN_PROGRESS", "PENDING", "PENDING", "PENDING", "PENDING"],
    },
    {
      buyOrderName: "SE VUORI – VM1198 – Transfer to Contourline",
      responsible: "Kishori",
      buyQty: 12000,
      totalSO: 6,
      totalFG: 2,
      refActiveFG: null,
      deadline: new Date("2026-05-10"),
      overallStatus: "BLOCKED" as const,
      remarks: "Blocked at Active SO & FG creation.",
      stepStatuses: ["BLOCKED", "PENDING", "PENDING", "PENDING", "PENDING", "PENDING"],
    },
  ];

  for (const s of sample) {
    const order = await prisma.order.create({
      data: {
        buyOrderName: s.buyOrderName,
        responsible: s.responsible,
        buyQty: s.buyQty,
        totalSO: s.totalSO,
        totalFG: s.totalFG,
        refActiveFG: s.refActiveFG,
        deadline: s.deadline,
        overallStatus: s.overallStatus,
        remarks: s.remarks,
      },
    });

    await prisma.step.createMany({
      data: STEP_NAMES.map((name, i) => ({
        orderId: order.id,
        stepNumber: i + 1,
        stepName: name,
        status: s.stepStatuses[i] as any,
        dateDone: s.stepStatuses[i] === "DONE" ? new Date() : null,
      })),
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
