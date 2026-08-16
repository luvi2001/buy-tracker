"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OVERALL_STATUSES } from "@/lib/steps";

export default function NewOrderPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      buyOrderName: form.get("buyOrderName"),
      responsible: form.get("responsible"),
      buyQty: form.get("buyQty"),
      totalSO: form.get("totalSO"),
      totalFG: form.get("totalFG"),
      refActiveFG: form.get("refActiveFG"),
      deadline: form.get("deadline"),
      overallStatus: form.get("overallStatus"),
      remarks: form.get("remarks"),
    };

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong. Please try again.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-lg font-semibold mb-1">New buy order entry</h1>
      <p className="text-sm text-muted mb-6">
        Adds a new row to the tracker with all 6 steps set to pending.
      </p>

      <form onSubmit={handleSubmit} className="bg-panel border border-line rounded-lg p-6 space-y-5">
        {error && (
          <div className="bg-bad/10 border border-bad/40 text-bad text-sm rounded px-3 py-2">
            {error}
          </div>
        )}

        <Field label="Buy order name" name="buyOrderName" required placeholder="e.g. SE GYMSHARK – SS27 New Buy – Shadowline" />

        <div className="grid grid-cols-2 gap-4">
          <Field label="Responsible" name="responsible" placeholder="e.g. Kishori" />
          <Field label="Deadline" name="deadline" type="date" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Buy qty" name="buyQty" type="number" defaultValue={0} />
          <Field label="Total SO" name="totalSO" type="number" defaultValue={0} />
          <Field label="Total FG" name="totalFG" type="number" defaultValue={0} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Ref active FG" name="refActiveFG" placeholder="e.g. 7001473758" />
          <div>
            <label className="block text-xs mono uppercase tracking-wider text-muted mb-1.5">
              Overall status
            </label>
            <select
              name="overallStatus"
              defaultValue="NOT_STARTED"
              className="w-full bg-panel2 border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
            >
              {OVERALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs mono uppercase tracking-wider text-muted mb-1.5">
            Remarks / notes
          </label>
          <textarea
            name="remarks"
            rows={3}
            className="w-full bg-panel2 border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
            placeholder="Optional notes…"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded bg-accent text-panel text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add entry"}
          </button>
          <a href="/" className="px-4 py-2 rounded border border-line text-sm text-muted hover:text-ink">
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder = "",
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number;
}) {
  return (
    <div>
      <label className="block text-xs mono uppercase tracking-wider text-muted mb-1.5">
        {label}
        {required && <span className="text-accent"> *</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full bg-panel2 border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
      />
    </div>
  );
}
