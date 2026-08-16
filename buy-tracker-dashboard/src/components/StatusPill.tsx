const COLORS: Record<string, string> = {
  COMPLETE: "bg-good/15 text-good border-good/40",
  DONE: "bg-good/15 text-good border-good/40",
  IN_PROGRESS: "bg-warn/15 text-warn border-warn/40",
  PENDING: "bg-idle/15 text-idle border-idle/40",
  NOT_STARTED: "bg-idle/15 text-idle border-idle/40",
  BLOCKED: "bg-bad/15 text-bad border-bad/40",
  OVERDUE: "bg-bad/15 text-bad border-bad/40",
};

const LABELS: Record<string, string> = {
  COMPLETE: "Complete",
  DONE: "Done",
  IN_PROGRESS: "In progress",
  PENDING: "Pending",
  NOT_STARTED: "Not started",
  BLOCKED: "Blocked",
  OVERDUE: "Overdue",
};

export default function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-block text-xs mono px-2 py-0.5 rounded border ${
        COLORS[status] || COLORS.PENDING
      }`}
    >
      {LABELS[status] || status}
    </span>
  );
}
