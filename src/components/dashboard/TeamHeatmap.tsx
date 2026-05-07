import { TEAM_MEMBERS } from "@/lib/mock-data";

const toneFor = (status: string) =>
  status === "Green" ? "var(--success)" : status === "Amber" ? "var(--warning)" : "var(--danger)";

export function TeamHeatmap() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {TEAM_MEMBERS.map((m) => (
        <div
          key={m.id}
          className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
        >
          <div className="absolute left-0 top-0 h-full w-1" style={{ background: toneFor(m.status) }} />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold leading-tight">{m.name}</p>
              <p className="text-xs text-muted-foreground">{m.role}</p>
            </div>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
              style={{ background: `color-mix(in oklab, ${toneFor(m.status)} 18%, transparent)`, color: toneFor(m.status) }}
            >
              {m.status}
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            <Bar label="Energy" value={m.energy} color="var(--chart-1)" />
            <Bar label="Load" value={m.load} color="var(--chart-2)" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}
