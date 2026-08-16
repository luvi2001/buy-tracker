export default function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="bg-panel border border-line rounded-lg px-5 py-4">
      <p className="text-xs mono uppercase tracking-wider text-muted">{label}</p>
      <p className={`text-3xl font-semibold mt-1 ${accent ? "text-accent" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}
