import { STEP_ICONS } from "@/lib/steps";

type Step = { stepNumber: number; stepName: string; status: string; dateDone: string | null };

const DOT: Record<string, string> = {
  DONE: "bg-good",
  IN_PROGRESS: "bg-warn",
  PENDING: "bg-idle",
  BLOCKED: "bg-bad",
};

export default function StepTrack({ steps }: { steps: Step[] }) {
  return (
    <div className="flex items-center gap-1.5" title="Step 1 through 6">
      {steps.map((s) => (
        <div
          key={s.stepNumber}
          className={`w-6 h-6 rounded flex items-center justify-center text-[10px] mono ${DOT[s.status] || DOT.PENDING} ${
            s.status === "PENDING" ? "text-ink/70" : "text-panel font-semibold"
          }`}
          title={`${STEP_ICONS[s.stepNumber - 1]} ${s.stepName}: ${s.status}`}
        >
          {s.stepNumber}
        </div>
      ))}
    </div>
  );
}
