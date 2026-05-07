import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity, AlertTriangle, BellRing, Brain, CalendarClock, ChevronRight,
  Coffee, Leaf, ShieldAlert, Sparkles, TrendingUp, Users, UserCheck, Zap,
} from "lucide-react";
import { ENERGY_TREND, MOCK_RESPONSES, TEAM_MEMBERS, type Profile } from "@/lib/mock-data";
import { EnergyGauge } from "@/components/dashboard/EnergyGauge";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { LoadRadar } from "@/components/dashboard/LoadRadar";
import { TeamHeatmap } from "@/components/dashboard/TeamHeatmap";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fikable HR Console — Team Wellbeing & Burnout Risk" },
      { name: "description", content: "HR & team-lead console: monitor team energy, cognitive load, burnout risk, and approve recovery actions across the org." },
    ],
  }),
  component: Dashboard,
});

// Map team members → backend profiles for drill-down
const MEMBER_PROFILE: Record<string, Profile> = {
  emp_001: "healthy",
  emp_042: "burnout_meetings",
  emp_117: "burnout_isolation",
  emp_054: "healthy",
  emp_088: "burnout_meetings",
  emp_023: "healthy",
};

function Dashboard() {
  const [selectedId, setSelectedId] = useState<string>("emp_042");
  const [running, setRunning] = useState(false);

  const selectedMember = TEAM_MEMBERS.find((m) => m.id === selectedId)!;
  const profile: Profile = MEMBER_PROFILE[selectedId] ?? "healthy";
  const data = useMemo(() => MOCK_RESPONSES[profile], [profile]);
  const trend = ENERGY_TREND[profile];
  const l1 = data.pipeline_metrics.l1_normalized_data;
  const l2 = data.pipeline_metrics.l2_digital_twin_state;
  const l3 = data.l3_application_payloads;

  // Org-wide aggregates
  const orgSize = TEAM_MEMBERS.length;
  const avgEnergy = Math.round(TEAM_MEMBERS.reduce((s, m) => s + m.energy, 0) / orgSize);
  const avgLoad = Math.round(TEAM_MEMBERS.reduce((s, m) => s + m.load, 0) / orgSize);
  const atRisk = TEAM_MEMBERS.filter((m) => m.status === "Red").length;
  const watch = TEAM_MEMBERS.filter((m) => m.status === "Amber").length;

  const runPipeline = () => {
    setRunning(true);
    setTimeout(() => setRunning(false), 1100);
  };

  // Alerts queue derived from team
  const alerts = TEAM_MEMBERS
    .filter((m) => m.status !== "Green")
    .map((m) => {
      const p = MEMBER_PROFILE[m.id] ?? "healthy";
      const r = MOCK_RESPONSES[p];
      return {
        id: m.id,
        name: m.name,
        role: m.role,
        severity: m.status,
        action: r.l3_application_payloads.manager_approval_queue.action.action_type,
        proposal: r.l3_application_payloads.manager_approval_queue.action.proposal_text,
        risk: r.pipeline_metrics.l1_normalized_data.flight_risk,
      };
    });

  return (
    <main className="mx-auto max-w-[1500px] px-6 py-10 md:py-14">
      {/* Header */}
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Leaf className="h-3.5 w-3.5 text-primary" />
            Fikable · HR & Team-Lead Console
          </div>
          <h1 className="font-display text-5xl font-semibold tracking-tight md:text-6xl">
            Team wellbeing, <span className="italic text-accent">at a glance.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            Monitor every team member's energy and cognitive load, surface burnout risk early,
            and approve recovery actions — powered by the L1 → L2 → L3 backend pipeline.
          </p>
        </div>
        <button
          onClick={runPipeline}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
        >
          <Sparkles className={`h-4 w-4 ${running ? "animate-spin" : ""}`} />
          {running ? "Syncing pipeline…" : "Sync /api/fikable/full_sync"}
        </button>
      </header>

      {/* Org KPI strip */}
      <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi icon={Users} label="Team size" value={orgSize} />
        <Kpi icon={Zap} label="Avg energy" value={avgEnergy} suffix="/100" tone="primary" />
        <Kpi icon={Brain} label="Avg cognitive load" value={avgLoad} suffix="/100" tone="accent" />
        <Kpi
          icon={ShieldAlert}
          label="At risk · watch"
          value={`${atRisk} · ${watch}`}
          tone={atRisk > 0 ? "danger" : watch > 0 ? "warning" : "success"}
        />
      </section>

      {/* Team heatmap (primary HR view) */}
      <section className="mb-8">
        <Panel eyebrow="Org-wide · Layer 3 aggregates" title="Team energy heatmap" icon={Users}>
          <p className="mb-5 text-sm text-muted-foreground">
            Click a member to drill into their digital twin, signals, and pending recovery actions.
          </p>
          <SelectableTeamHeatmap selectedId={selectedId} onSelect={setSelectedId} />
        </Panel>
      </section>

      {/* Action queue */}
      <section className="mb-8">
        <Panel eyebrow="Layer 3 · Manager approval queue" title="Pending recovery actions" icon={CalendarClock}>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending actions — your team is in flow.</p>
          ) : (
            <ul className="divide-y divide-border">
              {alerts.map((a) => (
                <li key={a.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: a.severity === "Red" ? "var(--danger)" : "var(--warning)" }}
                    />
                    <div>
                      <p className="text-sm font-semibold">
                        {a.name} <span className="font-normal text-muted-foreground">· {a.role}</span>
                      </p>
                      <p className="mt-1 text-sm text-foreground/80">{a.proposal}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-wider">
                        <Tag>{a.action}</Tag>
                        <Tag tone="warning">Flight risk: {a.risk}</Tag>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedId(a.id)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                    >
                      Review
                    </button>
                    <button
                      disabled
                      title="Coming soon"
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground opacity-60"
                    >
                      Approve
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>

      {/* Drill-down on selected member */}
      <section>
        <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
          <UserCheck className="h-3.5 w-3.5 text-primary" />
          Member drill-down
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{selectedMember.name}</span>
          <span className="text-muted-foreground">· {selectedMember.role}</span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Panel className="lg:col-span-5" eyebrow="Layer 2 · Digital twin" title="Current capacity" icon={Activity}>
            <div className="grid grid-cols-2 gap-4">
              <EnergyGauge value={l2.energy_level} label="Energy" />
              <EnergyGauge value={l2.cognitive_load} label="Cognitive Load" inverse />
            </div>
            <p className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-sm italic text-foreground/80">
              "{l2.state_summary}"
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <Stat label="Role" value={l1.role} />
              <Stat label="Flight risk" value={l1.flight_risk} />
            </div>
          </Panel>

          <Panel className="lg:col-span-7" eyebrow="7-day trajectory" title="Energy vs. cognitive load" icon={TrendingUp}>
            <TrendChart data={trend} />
          </Panel>

          <Panel className="lg:col-span-5" eyebrow="Layer 1 · Normalized signals" title="Stress signal radar" icon={Brain}>
            <LoadRadar data={l1} />
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <Stat label="Switches/hr" value={l1.switches_per_hr} />
              <Stat label="Busy work" value={`${l1.busy_work_pct}%`} />
              <Stat label="Interruptions" value={l1.interruption_volume} />
              <Stat label="After-hours" value={l1.after_hours ? "Yes" : "No"} />
            </div>
          </Panel>

          <div className="grid gap-6 lg:col-span-7">
            <Panel eyebrow="Recommended HR action" title={l3.manager_approval_queue.action.action_type} icon={AlertTriangle}>
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-foreground/85">{l3.manager_approval_queue.action.proposal_text}</p>
                <span className="shrink-0 rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-warning">
                  {l3.manager_approval_queue.approval_status.replace("_", " ")}
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Target · <span className="text-foreground">{l3.manager_approval_queue.action.target_meeting_or_time}</span>
              </p>
              <div className="mt-4 flex gap-2">
                <button disabled title="Coming soon" className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground opacity-60">Approve</button>
                <button disabled title="Coming soon" className="rounded-lg border border-border px-4 py-2 text-xs font-medium opacity-60">Defer</button>
                <button disabled title="Coming soon" className="rounded-lg border border-border px-4 py-2 text-xs font-medium opacity-60">Send 1:1 invite</button>
              </div>
            </Panel>

            <div className="grid gap-6 md:grid-cols-2">
              <Panel eyebrow="Suggested nudge to send" title={l3.active_notifications.content.nudge_title} icon={Coffee} accent>
                <p className="text-sm text-foreground/85">{l3.active_notifications.content.nudge_message}</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <BellRing className="h-3.5 w-3.5" />
                  Channels · Slack · Email · Desktop
                </div>
              </Panel>

              <Panel eyebrow="Workload guidance" title={l3.employee_dashboard.data.suggested_task_mode} icon={Sparkles}>
                <p className="text-sm text-foreground/85">
                  Afternoon forecast: <span className="font-medium text-foreground">{l3.employee_dashboard.data.afternoon_forecast}</span>
                </p>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                    style={{ width: `${l3.employee_dashboard.data.current_energy_score}%` }}
                  />
                </div>
              </Panel>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-12 text-center text-xs text-muted-foreground">
        Fikable HR Console · L1 Aggregator → L2 Cognitive Engine → L3 Action Layer
      </footer>
    </main>
  );
}

function SelectableTeamHeatmap({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  const tone = (s: string) => (s === "Green" ? "var(--success)" : s === "Amber" ? "var(--warning)" : "var(--danger)");
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {TEAM_MEMBERS.map((m) => {
        const active = m.id === selectedId;
        return (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className={`group relative overflow-hidden rounded-xl border bg-card p-4 text-left transition-shadow hover:shadow-md ${
              active ? "border-primary ring-2 ring-primary/30" : "border-border"
            }`}
          >
            <div className="absolute left-0 top-0 h-full w-1" style={{ background: tone(m.status) }} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold leading-tight">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.role}</p>
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                style={{ background: `color-mix(in oklab, ${tone(m.status)} 18%, transparent)`, color: tone(m.status) }}
              >
                {m.status}
              </span>
            </div>
            <div className="mt-3 space-y-1.5">
              <Bar label="Energy" value={m.energy} color="var(--chart-1)" />
              <Bar label="Load" value={m.load} color="var(--chart-2)" />
            </div>
          </button>
        );
      })}
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

function Tag({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "warning" }) {
  const c = tone === "warning" ? "var(--warning)" : "var(--muted-foreground)";
  return (
    <span
      className="rounded-full px-2 py-0.5 font-medium"
      style={{ background: `color-mix(in oklab, ${c} 14%, transparent)`, color: c }}
    >
      {children}
    </span>
  );
}

function Kpi({
  icon: Icon, label, value, suffix, tone = "default",
}: {
  icon: React.ElementType; label: string; value: string | number; suffix?: string;
  tone?: "default" | "primary" | "accent" | "success" | "warning" | "danger";
}) {
  const color =
    tone === "primary" ? "var(--primary)" : tone === "accent" ? "var(--accent)" :
    tone === "success" ? "var(--success)" : tone === "warning" ? "var(--warning)" :
    tone === "danger" ? "var(--danger)" : "var(--foreground)";
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-display text-3xl font-semibold" style={{ color }}>{value}</span>
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function Panel({
  children, title, eyebrow, icon: Icon, className = "", accent = false,
}: {
  children: React.ReactNode; title: string; eyebrow: string;
  icon: React.ElementType; className?: string; accent?: boolean;
}) {
  return (
    <div
      className={`glass-card rounded-2xl p-6 ${className}`}
      style={accent ? { background: "color-mix(in oklab, var(--accent) 10%, var(--card))" } : undefined}
    >
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</span>
      </div>
      <h3 className="font-display text-2xl font-semibold leading-tight">{title}</h3>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2">
      <span>{label}</span>
      <span className="font-medium tabular-nums text-foreground">{value}</span>
    </div>
  );
}
