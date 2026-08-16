import { prisma } from "@/lib/prisma";
import { STEP_NAMES, STEP_ICONS } from "@/lib/steps";
import StatCard from "@/components/StatCard";
import OrderTable from "@/components/OrderTable";
import StatusPill from "@/components/StatusPill";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const orders = await prisma.order.findMany({
    include: { steps: { orderBy: { stepNumber: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  type StepRow = { stepNumber: number; stepName: string; status: string };
  type OrderRow = (typeof orders)[number];

  const totalBuys = orders.length;
  const totalQty = orders.reduce((sum: number, o: OrderRow) => sum + o.buyQty, 0);
  const statusBreakdown = { COMPLETE: 0, IN_PROGRESS: 0, BLOCKED: 0, NOT_STARTED: 0, OVERDUE: 0 };
  for (const o of orders) statusBreakdown[o.overallStatus as keyof typeof statusBreakdown]++;

  const activePerStep = STEP_NAMES.map((name, i) => {
    const stepNumber = i + 1;
    const count = orders.filter((o: OrderRow) => {
      if (o.overallStatus === "COMPLETE") return false;
      const step = o.steps.find((s: StepRow) => s.stepNumber === stepNumber);
      return step && step.status !== "DONE";
    }).length;
    return { stepNumber, name, count };
  });

  const needsAttention = orders.filter(
    (o: OrderRow) => o.overallStatus === "BLOCKED" || o.overallStatus === "OVERDUE"
  );

  return (
    <div className="space-y-8">
      {/* Top stats — mirrors the DASHBOARD sheet's summary row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total buys" value={totalBuys} accent />
        <StatCard label="Total qty" value={totalQty.toLocaleString()} />
        <StatCard label="Complete" value={statusBreakdown.COMPLETE} />
        <StatCard label="In progress / blocked" value={statusBreakdown.IN_PROGRESS + statusBreakdown.BLOCKED} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active orders per step */}
        <div className="lg:col-span-2 bg-panel border border-line rounded-lg p-5">
          <h2 className="text-xs mono uppercase tracking-wider text-muted mb-4">
            Active orders per step
          </h2>
          <div className="space-y-3">
            {activePerStep.map((s) => (
              <div key={s.stepNumber} className="flex items-center gap-3">
                <span className="w-6 text-accent mono text-sm">{STEP_ICONS[s.stepNumber - 1]}</span>
                <span className="flex-1 text-sm">{s.name}</span>
                <div className="w-40 h-2 bg-panel2 rounded overflow-hidden">
                  <div
                    className="h-full bg-accent"
                    style={{ width: totalBuys ? `${(s.count / totalBuys) * 100}%` : "0%" }}
                  />
                </div>
                <span className="w-8 text-right mono text-sm text-muted">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Items needing attention */}
        <div className="bg-panel border border-line rounded-lg p-5">
          <h2 className="text-xs mono uppercase tracking-wider text-muted mb-4">
            Items needing attention
          </h2>
          {needsAttention.length === 0 ? (
            <p className="text-sm text-muted">Nothing blocked or overdue right now.</p>
          ) : (
            <ul className="space-y-3">
              {needsAttention.map((o: OrderRow) => (
                <li key={o.id} className="text-sm">
                  <p className="font-medium leading-snug">{o.buyOrderName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusPill status={o.overallStatus} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Full tracker table */}
      <section>
        <h2 className="text-xs mono uppercase tracking-wider text-muted mb-3">
          All buy orders
        </h2>
        <OrderTable orders={JSON.parse(JSON.stringify(orders))} />
      </section>
    </div>
  );
}
