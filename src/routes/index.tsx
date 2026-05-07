import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Activity, AlertTriangle, Brain, Building2, CheckCircle2, Leaf,
  Lightbulb, RefreshCw, Server, ShieldAlert, Sparkles, Users, Zap,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fikable HR Console — Live Team Wellbeing" },
      { name: "description", content: "Live HR dashboard fetching team burnout risk, energy, and macro insights from the Fikable backend." },
    ],
  }),
  component: Dashboard,
});

// ---------- Types matching backend /api/fikable/admin/dashboard ----------
// PRIVACY: backend never exposes individual employee identities.
// Admin sees only aggregated metrics + role-grouped aggregates.
interface RoleAggregate {
  team_or_role: string;
  headcount: number;
  avg_meeting_hrs: number;
  avg_interruptions: number;
  high_burnout_risk_count: number;
  status: "Critical" | "Stable" | string;
}
interface DashboardPayload {
  status: string;
  dashboard_data: {
    team_metrics: {
      total_headcount: number;
      department_averages: {
        meeting_burden_hrs: number;
        cognitive_switches_per_hr: number;
      };
      risk_distribution: {
        healthy: number;
        high_burnout_risk: number;
      };
    };
    organizational_insight: {
      macro_risk_identified: string;
      proposed_policy_change: string;
      expected_roi: string;
    };
    anonymized_role_aggregates: RoleAggregate[];
  };
}

const DEFAULT_API = "http://localhost:8000";
const STORAGE_KEY = "fikable_api_base";

async function fetchDashboard(base: string): Promise<DashboardPayload> {
  const res = await fetch(`${base.replace(/\/$/, "")}/api/fikable/admin/dashboard`);
  if (!res.ok) throw new Error(`Backend ${res.status}: ${await res.text()}`);
  return res.json();
}

function Dashboard() {
  const [apiBase, setApiBase] = useState(DEFAULT_API);
  const [draft, setDraft] = useState(DEFAULT_API);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) { setApiBase(stored); setDraft(stored); }
  }, []);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["admin-dashboard", apiBase],
    queryFn: () => fetchDashboard(apiBase),
    retry: 0,
    refetchOnWindowFocus: false,
  });

  const saveBase = () => {
    localStorage.setItem(STORAGE_KEY, draft);
    setApiBase(draft);
  };

  return (
    <main className="mx-auto max-w-[1500px] px-6 py-10 md:py-14">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Leaf className="h-3.5 w-3.5 text-primary" />
            Fikable · HR & Team-Lead Console
          </div>
          <h1 className="font-display text-5xl font-semibold tracking-tight md:text-6xl">
            Live team wellbeing, <span className="italic text-accent">straight from the pipeline.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            Real-time fetch from <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/api/fikable/admin/dashboard</code> —
            aggregated team metrics, macro burnout risk, and an LLM-generated policy recommendation.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          {isFetching ? "Syncing…" : "Refresh"}
        </button>
      </header>

      {/* API base configurator */}
      <div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card/50 p-4 text-sm">
        <Server className="h-4 w-4 text-primary" />
        <span className="text-muted-foreground">Backend URL</span>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="min-w-[280px] flex-1 rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-xs"
          placeholder="http://localhost:8000"
        />
        <button
          onClick={saveBase}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          Save & fetch
        </button>
        <span className="text-xs text-muted-foreground">
          Tip: must be reachable from this browser (CORS-enabled).
        </span>
      </div>

      {/* Loading / Error states */}
      {isLoading && <SkeletonState />}
      {error && <ErrorState message={(error as Error).message} apiBase={apiBase} />}

      {data && data.dashboard_data && (
        <DashboardContent payload={data.dashboard_data} />
      )}

      <footer className="mt-12 text-center text-xs text-muted-foreground">
        Fikable HR Console · L1 Aggregator → L2 Cognitive Engine → L3 Action Layer
      </footer>
    </main>
  );
}

// ---------- Content ----------
function DashboardContent({ payload }: { payload: DashboardPayload["dashboard_data"] }) {
  const { team_metrics, organizational_insight, anonymized_role_aggregates } = payload;
  const { total_headcount, department_averages, risk_distribution } = team_metrics;

  const riskPct = total_headcount
    ? Math.round((risk_distribution.high_burnout_risk / total_headcount) * 100)
    : 0;

  const pieData = [
    { name: "Healthy", value: risk_distribution.healthy, color: "var(--success)" },
    { name: "High burnout risk", value: risk_distribution.high_burnout_risk, color: "var(--danger)" },
  ];

  const roleBars = anonymized_role_aggregates.map((r) => ({
    name: r.team_or_role,
    meetings: r.avg_meeting_hrs,
    interruptions: r.avg_interruptions,
    risk: r.high_burnout_risk_count,
  }));

  return (
    <>
      {/* Privacy notice */}
      <div className="mb-6 flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
        <ShieldAlert className="h-3.5 w-3.5 text-primary" />
        Privacy-first view — no individual identities. All signals are aggregated by role.
      </div>

      {/* KPI strip */}
      <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi icon={Users} label="Headcount" value={total_headcount} />
        <Kpi icon={Activity} label="Avg meeting hrs" value={department_averages.meeting_burden_hrs} suffix="h" tone="primary" />
        <Kpi icon={Brain} label="Avg switches/hr" value={department_averages.cognitive_switches_per_hr} tone="accent" />
        <Kpi
          icon={ShieldAlert}
          label="At burnout risk"
          value={`${risk_distribution.high_burnout_risk}/${total_headcount}`}
          suffix={` · ${riskPct}%`}
          tone={riskPct >= 40 ? "danger" : riskPct > 0 ? "warning" : "success"}
        />
      </section>

      {/* Macro insight + risk distribution */}
      <section className="mb-8 grid gap-6 lg:grid-cols-12">
        <Panel className="lg:col-span-7" eyebrow="Layer 3 · Chief HR AI" title="Organizational insight" icon={Lightbulb} accent>
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                <AlertTriangle className="h-3 w-3 text-warning" /> Macro risk identified
              </div>
              <p className="text-base text-foreground/90">{organizational_insight.macro_risk_identified}</p>
            </div>
            <div className="rounded-xl border border-border bg-background/50 p-4">
              <div className="mb-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Proposed policy change</div>
              <p className="font-display text-2xl font-semibold text-accent">
                {organizational_insight.proposed_policy_change}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{organizational_insight.expected_roi}</p>
            </div>
          </div>
        </Panel>

        <Panel className="lg:col-span-5" eyebrow="Layer 1 · Aggregated" title="Risk distribution" icon={Building2}>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3}>
                  {pieData.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </section>

      {/* Per-role bar chart (anonymized) */}
      <section className="mb-8">
        <Panel eyebrow="Per-role · Anonymized aggregates" title="Workload signals across roles" icon={Brain}>
          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleBars} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="meetings" name="Avg meeting hrs" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="interruptions" name="Avg interruptions" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="risk" name="High-risk count" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </section>

      {/* Role aggregates table */}
      <section>
        <Panel eyebrow="Role aggregates" title="Anonymized team breakdown" icon={Users}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  <th className="py-3 pr-4">Team / Role</th>
                  <th className="py-3 pr-4 text-right">Headcount</th>
                  <th className="py-3 pr-4 text-right">Avg meeting hrs</th>
                  <th className="py-3 pr-4 text-right">Avg interruptions</th>
                  <th className="py-3 pr-4 text-right">High-risk count</th>
                  <th className="py-3 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {anonymized_role_aggregates.map((r) => {
                  const critical = r.status === "Critical";
                  return (
                    <tr key={r.team_or_role} className="border-b border-border/60 last:border-0">
                      <td className="py-3 pr-4 font-medium">{r.team_or_role}</td>
                      <td className="py-3 pr-4 text-right tabular-nums">{r.headcount}</td>
                      <td className="py-3 pr-4 text-right tabular-nums">{r.avg_meeting_hrs}</td>
                      <td className="py-3 pr-4 text-right tabular-nums">{r.avg_interruptions}</td>
                      <td className="py-3 pr-4 text-right tabular-nums">{r.high_burnout_risk_count}</td>
                      <td className="py-3 pr-4">
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                          style={{
                            background: `color-mix(in oklab, ${critical ? "var(--danger)" : "var(--success)"} 18%, transparent)`,
                            color: critical ? "var(--danger)" : "var(--success)",
                          }}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>
    </>
  );
}

// ---------- States ----------
function SkeletonState() {
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-card/50" />
        ))}
      </div>
      <div className="h-[320px] animate-pulse rounded-2xl border border-border bg-card/50" />
    </div>
  );
}

function ErrorState({ message, apiBase }: { message: string; apiBase: string }) {
  return (
    <div className="rounded-2xl border border-danger/40 bg-danger/5 p-6 text-sm">
      <div className="mb-2 flex items-center gap-2 font-semibold text-danger">
        <AlertTriangle className="h-4 w-4" /> Could not reach backend
      </div>
      <p className="text-foreground/80">
        Failed to fetch from <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{apiBase}/api/fikable/admin/dashboard</code>
      </p>
      <p className="mt-2 text-xs text-muted-foreground">Error: {message}</p>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
        <li>Make sure the FastAPI backend is running on the URL above.</li>
        <li>Enable CORS in FastAPI for this origin (add <code>CORSMiddleware</code> with <code>allow_origins=["*"]</code> for testing).</li>
        <li>If running on <code>localhost:8000</code>, this UI must be opened from a browser on the same machine.</li>
      </ul>
    </div>
  );
}

// ---------- Reusable bits ----------
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
