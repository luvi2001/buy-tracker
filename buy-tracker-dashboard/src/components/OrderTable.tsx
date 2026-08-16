"use client";

import { Fragment } from "react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import StatusPill from "./StatusPill";
import StepTrack from "./StepTrack";
import { OVERALL_STATUSES, STEP_STATUSES } from "@/lib/steps";

type Order = {
  id: string;
  buyOrderName: string;
  responsible: string | null;
  buyQty: number;
  totalSO: number;
  totalFG: number;
  refActiveFG: string | null;
  deadline: string | null;
  overallStatus: string;
  remarks: string | null;
  steps: { stepNumber: number; stepName: string; status: string; dateDone: string | null }[];
};

type StepDraft = {
  stepNumber: number;
  stepName: string;
  status: string;
};

type OrderDraft = {
  buyOrderName: string;
  responsible: string;
  buyQty: string;
  totalSO: string;
  totalFG: string;
  refActiveFG: string;
  deadline: string;
  overallStatus: string;
  remarks: string;
};

// Number of columns in the table header/body — kept in one place so the
// empty-state and edit-row colSpan can't drift out of sync with the <th> list.
const COLUMN_COUNT = 9;

export default function OrderTable({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("ALL");
  const [query, setQuery] = useState("");
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [draftOrder, setDraftOrder] = useState<OrderDraft | null>(null);
  const [draftSteps, setDraftSteps] = useState<StepDraft[]>([]);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = orders.filter((o) => {
    const matchesStatus = filter === "ALL" || o.overallStatus === filter;
    const matchesQuery = o.buyOrderName.toLowerCase().includes(query.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  function beginEdit(order: Order) {
    setError(null);
    setEditingOrderId(order.id);
    setDraftOrder({
      buyOrderName: order.buyOrderName,
      responsible: order.responsible || "",
      buyQty: String(order.buyQty),
      totalSO: String(order.totalSO),
      totalFG: String(order.totalFG),
      refActiveFG: order.refActiveFG || "",
      deadline: order.deadline ? new Date(order.deadline).toISOString().slice(0, 10) : "",
      overallStatus: order.overallStatus,
      remarks: order.remarks || "",
    });
    setDraftSteps(
      order.steps.map((step) => ({
        stepNumber: step.stepNumber,
        stepName: step.stepName,
        status: step.status,
      }))
    );
  }

  function updateStep(stepNumber: number, status: string) {
    setDraftSteps((current) =>
      current.map((step) => (step.stepNumber === stepNumber ? { ...step, status } : step))
    );
  }

  function updateOrderField(field: keyof OrderDraft, value: string) {
    setDraftOrder((current) => (current ? { ...current, [field]: value } : current));
  }

  async function saveChanges(orderId: string) {
    if (!draftOrder) {
      return;
    }

    setSavingOrderId(orderId);
    setError(null);

    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buyOrderName: draftOrder.buyOrderName.trim(),
        responsible: draftOrder.responsible.trim() || null,
        buyQty: Number(draftOrder.buyQty) || 0,
        totalSO: Number(draftOrder.totalSO) || 0,
        totalFG: Number(draftOrder.totalFG) || 0,
        refActiveFG: draftOrder.refActiveFG.trim() || null,
        deadline: draftOrder.deadline || null,
        overallStatus: draftOrder.overallStatus,
        remarks: draftOrder.remarks.trim() || null,
        steps: draftSteps.map((step) => ({
          stepNumber: step.stepNumber,
          status: step.status,
        })),
      }),
    });

    setSavingOrderId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not update steps. Please try again.");
      return;
    }

    setEditingOrderId(null);
    setDraftOrder(null);
    setDraftSteps([]);
    router.refresh();
  }

  async function deleteOrder(orderId: string) {
    const confirmed = window.confirm("Delete this buy order? This cannot be undone.");
    if (!confirmed) {
      return;
    }

    setSavingOrderId(orderId);
    setError(null);

    const res = await fetch(`/api/orders/${orderId}`, {
      method: "DELETE",
    });

    setSavingOrderId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not delete this order. Please try again.");
      return;
    }

    if (editingOrderId === orderId) {
      setEditingOrderId(null);
      setDraftOrder(null);
      setDraftSteps([]);
    }

    router.refresh();
  }

  const stepStatusOptions = useMemo(
    () => STEP_STATUSES.map((status) => ({ value: status, label: status.replace("_", " ") })),
    []
  );

  return (
    <div className="bg-panel border border-line rounded-lg overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-line">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search buy order name…"
          className="bg-panel2 border border-line rounded px-3 py-1.5 text-sm mono w-64 focus:outline-none focus:border-accent"
        />
        <div className="flex gap-1.5 text-xs mono">
          {["ALL", "COMPLETE", "IN_PROGRESS", "BLOCKED", "NOT_STARTED", "OVERDUE"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-2.5 py-1 rounded border ${
                filter === s ? "border-accent text-accent" : "border-line text-muted hover:text-ink"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs mono text-muted">{filtered.length} of {orders.length} orders</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs mono uppercase tracking-wider text-muted border-b border-line">
              <th className="px-4 py-2.5 font-medium">Buy order</th>
              <th className="px-4 py-2.5 font-medium">Responsible</th>
              <th className="px-4 py-2.5 font-medium text-right">Buy qty</th>
              <th className="px-4 py-2.5 font-medium text-right">SO / FG</th>
              <th className="px-4 py-2.5 font-medium">Ref active FG</th>
              <th className="px-4 py-2.5 font-medium">Deadline</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Steps 1–6</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <Fragment key={o.id}>
                <tr className="border-b border-line/60 hover:bg-panel2 align-top">
                  <td className="px-4 py-3 max-w-[320px]">
                    <p className="font-medium leading-snug">{o.buyOrderName}</p>
                    {o.remarks && <p className="text-xs text-muted mt-1 leading-snug">{o.remarks}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted">{o.responsible || "—"}</td>
                  <td className="px-4 py-3 text-right mono">{o.buyQty.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right mono text-muted">
                    {o.totalSO} / {o.totalFG}
                  </td>
                  <td className="px-4 py-3 mono text-muted">{o.refActiveFG || "—"}</td>
                  <td className="px-4 py-3 mono text-muted">
                    {o.deadline ? new Date(o.deadline).toLocaleDateString("en-GB") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={o.overallStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <StepTrack steps={o.steps} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => (editingOrderId === o.id ? setEditingOrderId(null) : beginEdit(o))}
                        className="px-3 py-1.5 rounded border border-line text-xs mono text-muted hover:text-ink"
                      >
                        {editingOrderId === o.id ? "Close" : "Edit details"}
                      </button>
                      <button
                        type="button"
                        disabled={savingOrderId === o.id}
                        onClick={() => deleteOrder(o.id)}
                        className="px-3 py-1.5 rounded border border-bad/40 text-xs mono text-bad hover:bg-bad/10 disabled:opacity-50"
                      >
                        {savingOrderId === o.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>

                {editingOrderId === o.id && (
                  <tr className="border-b border-line/60 bg-panel2/60">
                    <td colSpan={COLUMN_COUNT} className="px-4 py-4">
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs mono uppercase tracking-wider text-muted">Update order details</p>
                            <p className="text-sm text-muted mt-1">
                              Edit the order fields and step statuses below, then save to update the tracker.
                            </p>
                          </div>
                          {error && <p className="text-sm text-bad">{error}</p>}
                        </div>

                        {draftOrder && (
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            <FieldDraft
                              label="Buy order name"
                              value={draftOrder.buyOrderName}
                              onChange={(value) => updateOrderField("buyOrderName", value)}
                              className="md:col-span-2 xl:col-span-3"
                              required
                            />
                            <FieldDraft
                              label="Responsible"
                              value={draftOrder.responsible}
                              onChange={(value) => updateOrderField("responsible", value)}
                            />
                            <FieldDraft
                              label="Deadline"
                              value={draftOrder.deadline}
                              onChange={(value) => updateOrderField("deadline", value)}
                              type="date"
                            />
                            <FieldDraft
                              label="Buy qty"
                              value={draftOrder.buyQty}
                              onChange={(value) => updateOrderField("buyQty", value)}
                              type="number"
                            />
                            <FieldDraft
                              label="Total SO"
                              value={draftOrder.totalSO}
                              onChange={(value) => updateOrderField("totalSO", value)}
                              type="number"
                            />
                            <FieldDraft
                              label="Total FG"
                              value={draftOrder.totalFG}
                              onChange={(value) => updateOrderField("totalFG", value)}
                              type="number"
                            />
                            <FieldDraft
                              label="Ref active FG"
                              value={draftOrder.refActiveFG}
                              onChange={(value) => updateOrderField("refActiveFG", value)}
                            />
                            <div>
                              <label className="block text-xs mono uppercase tracking-wider text-muted mb-1.5">
                                Overall status
                              </label>
                              <select
                                value={draftOrder.overallStatus}
                                onChange={(e) => updateOrderField("overallStatus", e.target.value)}
                                className="w-full bg-panel2 border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
                              >
                                {OVERALL_STATUSES.map((status) => (
                                  <option key={status} value={status}>
                                    {status.replace("_", " ")}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="md:col-span-2 xl:col-span-3">
                              <label className="block text-xs mono uppercase tracking-wider text-muted mb-1.5">
                                Remarks / notes
                              </label>
                              <textarea
                                value={draftOrder.remarks}
                                onChange={(e) => updateOrderField("remarks", e.target.value)}
                                rows={3}
                                className="w-full bg-panel2 border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
                                placeholder="Optional notes…"
                              />
                            </div>
                          </div>
                        )}

                        <div className="grid gap-3 lg:grid-cols-2">
                          {draftSteps.map((step) => (
                            <label
                              key={step.stepNumber}
                              className="flex items-center justify-between gap-3 rounded border border-line bg-panel px-3 py-2"
                            >
                              <span className="text-xs leading-tight">
                                <span className="block mono text-muted uppercase tracking-wider">
                                  Step {step.stepNumber}
                                </span>
                                <span className="block font-medium">{step.stepName}</span>
                              </span>
                              <select
                                value={step.status}
                                onChange={(e) => updateStep(step.stepNumber, e.target.value)}
                                className="min-w-32 bg-panel2 border border-line rounded px-2 py-1.5 text-xs mono focus:outline-none focus:border-accent"
                              >
                                {stepStatusOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          ))}
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={savingOrderId === o.id}
                            onClick={() => saveChanges(o.id)}
                            className="px-4 py-2 rounded bg-accent text-panel text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                          >
                            {savingOrderId === o.id ? "Saving…" : "Save changes"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingOrderId(null);
                              setDraftOrder(null);
                              setDraftSteps([]);
                              setError(null);
                            }}
                            className="px-4 py-2 rounded border border-line text-sm text-muted hover:text-ink"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={COLUMN_COUNT} className="px-4 py-8 text-center text-muted">
                  No orders match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FieldDraft({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs mono uppercase tracking-wider text-muted mb-1.5">
        {label}
        {required && <span className="text-accent"> *</span>}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        required={required}
        className="w-full bg-panel2 border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
      />
    </div>
  );
}