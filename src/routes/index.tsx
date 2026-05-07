import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity, AlertTriangle, BellRing, Brain, CalendarClock, Coffee,
  Leaf, Sparkles, TrendingUp, Users, Zap,
} from "lucide-react";
import { ENERGY_TREND, MOCK_RESPONSES, type Profile } from "@/lib/mock-data";
import { EnergyGauge } from "@/components/dashboard/EnergyGauge";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { LoadRadar } from "@/components/dashboard/LoadRadar";
import { TeamHeatmap } from "@/components/dashboard/TeamHeatmap";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fikable — Cognitive Load & Energy Dashboard" },
      { name: "description", content: "Visualize the Fikable multi-layer pipeline: digital twin energy, cognitive load, fika nudges, and team heatmap." },
    ],
  }),
  component: Dashboard,
});

const PROFILES: { id: Profile; label: string; hint: string }[] = [
  { id: "healthy", label: "Healthy", hint: "Balanced flow" },
  { id: "burnout_meetings", label: "Meeting overload", hint: "Burnout signals" },
  { id: "burnout_isolation", label: "Isolation", hint: "Disengagement" },
];

function Dashboard() {
  const [profile, setProfile] = useState<Profile>("burnout_meetings");
  const [running, setRunning] = useState(false);
  const data = useMemo(() => MOCK_RESPONSES[profile], [profile]);
  const trend = ENERGY_TREND[profile];
  const l1 = data.pipeline_metrics.l1_normalized_data;
  const l2 = data.pipeline_metrics.l2_digital_twin_state;
  const l3 = data.l3_application_payloads;

  const runPipeline = () => {
    setRunning(true);
    setTimeout(() => setRunning(false), 1100);
  };

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-10 md:py-14">
      {/* Header */}
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Leaf className="h-3.5 w-3.5 text-primary" />
            Fikable · Multi-Layer Wellness Pipeline
          </div>
          <h1 className="font-display text-5xl font-semibold tracking-tight md:text-6xl">
            The Digital Twin <span className="italic text-accent">of energy.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
            Real-time cognitive load, burnout forecasting, and gentle Fika nudges — visualized from the L1 → L2 → L3 backend pipeline.
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex gap-1 rounded-full border border-border bg-card/60 p-1 backdrop-blur">
            {PROFILES.map((p) => (
              <button
                key={p.id}
                onClick={() => setProfile(p.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                  profile === p.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={runPipeline}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
          >
            <Sparkles className={`h-4 w-4 ${running ? "animate-spin" : ""}`} />
            {running ? "Running pipeline…" : "Run /api/fikable/full_sync"}
          </button>
        </div>
      </header>

      {/* Top KPI strip */}
      <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi icon={Zap} label="Energy" value={`${l2.energy_level}`} suffix="/100" tone="primary" />
        <Kpi icon={Brain} label="Cognitive Load" value={`${l2.cognitive_load}`} suffix="/100" tone="accent" />
        <Kpi icon={CalendarClock} label="Meeting hrs today" value={`${l1.meeting_burden_hrs}`} suffix="h" />
        <Kpi
          icon={AlertTriangle}
          label="Flight risk"
          value={l1.flight_risk}
          tone={l1.flight_risk === "Low" ? "success" : l1.flight_risk === "High" ? "warning" : "danger"}
        />
      </section>

      {/* Main grid */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Digital Twin */}
        <Panel
          className="lg:col-span-5"
          eyebrow="Layer 2 · Digital twin"
          title="Current capacity"
          icon={Activity}
        >
          <div className="grid grid-cols-2 gap-4">
            <EnergyGauge value={l2.energy_level} label="Energy" />
            <EnergyGauge value={l2.cognitive_load} label="Cognitive Load" inverse />
          </div>
          <p className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-sm italic text-foreground/80">
            “{l2.state_summary}”
          </p>
        </Panel>

        {/* Trend */}
        <Panel
          className="lg:col-span-7"
          eyebrow="7-day trajectory"
          title="Energy vs. cognitive load"
          icon={TrendingUp}
        >
          <TrendChart data={trend} />
        </Panel>

        {/* Stress radar */}
        <Panel
          className="lg:col-span-5"
          eyebrow="Layer 1 · Normalized signals"
          title="Stress signal radar"
          icon={Brain}
        >
          <LoadRadar data={l1} />
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <Stat label="Switches/hr" value={l1.switches_per_hr} />
            <Stat label="Busy work" value={`${l1.busy_work_pct}%`} />
            <Stat label="Interruptions" value={l1.interruption_volume} />
            <Stat label="After-hours" value={l1.after_hours ? "Yes" : "No"} />
          </div>
        </Panel>

        {/* L3 actions */}
        <div className="grid gap-6 lg:col-span-7">
          <Panel eyebrow="Layer 3 · Manager queue" title={l3.manager_approval_queue.action.action_type} icon={CalendarClock}>
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
              <button className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90">Approve</button>
              <button className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted">Defer</button>
            </div>
          </Panel>

          <div className="grid gap-6 md:grid-cols-2">
            <Panel eyebrow="Fika nudge" title={l3.active_notifications.content.nudge_title} icon={Coffee} accent>
              <p className="text-sm text-foreground/85">{l3.active_notifications.content.nudge_message}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <BellRing className="h-3.5 w-3.5" />
                Push · Slack · Desktop
              </div>
            </Panel>

            <Panel eyebrow="Recommended mode" title={l3.employee_dashboard.data.suggested_task_mode} icon={Sparkles}>
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

        {/* Team heatmap */}
        <Panel className="lg:col-span-12" eyebrow="Team aggregate" title="Energy heatmap" icon={Users}>
          <p className="mb-5 text-sm text-muted-foreground">
            Status: <span className="text-foreground">{l3.team_aggregates.data.team_flow_status}</span>
          </p>
          <TeamHeatmap />
        </Panel>
      </section>

      <footer className="mt-12 text-center text-xs text-muted-foreground">
        Fikable · L1 Aggregator → L2 Cognitive Engine → L3 Action Layer
      </footer>
    </main>
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
