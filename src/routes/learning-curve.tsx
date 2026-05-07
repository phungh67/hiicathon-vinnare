import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ArrowLeft, Brain, CheckCircle2, LineChart as LineChartIcon,
  Sparkles, Target, TrendingUp, Zap,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export const Route = createFileRoute("/learning-curve")({
  head: () => ({
    meta: [
      { title: "Reinforcement Learning Curve — Fikable HR" },
      { name: "description", content: "Admin dashboard tracking how Fikable's LLM-powered interventions improve over time." },
    ],
  }),
  component: LearningCurvePage,
});

// ---------- Mock training-curve data ----------
const WEEKS = 16;

function buildSeries() {
  // Simulate a learning curve: accuracy climbs, regret falls.
  return Array.from({ length: WEEKS }, (_, i) => {
    const w = i + 1;
    const noise = (Math.sin(i * 1.3) + Math.cos(i * 0.7)) * 1.5;
    return {
      week: `W${w}`,
      acceptance_rate: Math.min(95, 42 + i * 3.1 + noise),         // % nudges accepted
      false_positive: Math.max(3, 28 - i * 1.4 + noise * 0.6),     // % false alarms
      coaching_quality: Math.min(96, 55 + i * 2.4 + noise * 0.4),  // manager rating
      llm_confidence: Math.min(0.98, 0.55 + i * 0.025 + noise * 0.005),
    };
  });
}

const interventionMix = [
  { name: "Auto-rebalance", value: 38 },
  { name: "Fika nudge", value: 27 },
  { name: "Manager script", value: 22 },
  { name: "Escalation", value: 13 },
];
const PIE_COLORS = ["var(--primary)", "var(--accent)", "var(--warning)", "var(--danger)"];

const milestones = [
  { week: "W2", label: "Cold-start baseline", note: "First org-wide nudges shipped" },
  { week: "W6", label: "Manager-script v2", note: "Switched to Gemma-4 for coaching" },
  { week: "W11", label: "RLHF loop online", note: "Began ingesting Slack accept/snooze signals" },
  { week: "W14", label: "Pattern-aware reranker", note: "Burnout pattern catalog wired into prompt" },
];

function LearningCurvePage() {
  const series = useMemo(buildSeries, []);
  const latest = series[series.length - 1];
  const first = series[0];

  const delta = (key: keyof typeof latest) =>
    ((Number(latest[key]) - Number(first[key])) /
      Math.max(0.01, Number(first[key]))) *
    100;

  return (
    <main className="mx-auto max-w-[1500px] px-6 py-10 md:py-14">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <Link
            to="/"
            className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Back to dashboard
          </Link>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Fikable · Reinforcement Learning Curve
          </div>
          <h1 className="font-display text-5xl font-semibold tracking-tight md:text-6xl">
            How the model is{" "}
            <span className="italic text-accent">getting better</span>.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            Fikable is powered by a local LLM that learns from every accepted /
            snoozed nudge. This dashboard tracks acceptance rate, false-positive
            rate, coaching quality, and confidence — week over week.
          </p>
        </div>
      </header>

      {/* KPI strip */}
      <section className="mb-8 grid gap-4 md:grid-cols-4">
        <KpiCard
          icon={<CheckCircle2 className="h-4 w-4 text-primary" />}
          label="Nudge acceptance"
          value={`${latest.acceptance_rate.toFixed(0)}%`}
          delta={delta("acceptance_rate")}
        />
        <KpiCard
          icon={<Target className="h-4 w-4 text-accent" />}
          label="False-positive rate"
          value={`${latest.false_positive.toFixed(1)}%`}
          delta={delta("false_positive")}
          inverse
        />
        <KpiCard
          icon={<Brain className="h-4 w-4 text-warning" />}
          label="Coaching quality"
          value={`${latest.coaching_quality.toFixed(0)} / 100`}
          delta={delta("coaching_quality")}
        />
        <KpiCard
          icon={<Zap className="h-4 w-4 text-danger" />}
          label="LLM confidence"
          value={latest.llm_confidence.toFixed(2)}
          delta={delta("llm_confidence")}
        />
      </section>

      {/* Main learning curve */}
      <section className="glass-card mb-6 rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-2">
          <LineChartIcon className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">
            Reinforcement signal over 16 weeks
          </h2>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="week" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="acceptance_rate" stroke="var(--primary)" strokeWidth={2.5} dot={false} name="Acceptance %" />
              <Line type="monotone" dataKey="coaching_quality" stroke="var(--accent)" strokeWidth={2.5} dot={false} name="Coaching quality" />
              <Line type="monotone" dataKey="false_positive" stroke="var(--danger)" strokeWidth={2} dot={false} strokeDasharray="4 4" name="False-positive %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Confidence area chart */}
        <section className="glass-card rounded-2xl p-6 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            <h2 className="font-display text-lg font-semibold">Model confidence trajectory</h2>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis domain={[0.4, 1]} stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="llm_confidence"
                  stroke="var(--accent)"
                  fill="url(#confGrad)"
                  strokeWidth={2}
                  name="LLM confidence"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Intervention mix */}
        <section className="glass-card rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Intervention mix</h2>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={interventionMix} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={3}>
                  {interventionMix.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Milestones */}
      <section className="glass-card mt-6 rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-2">
          <Brain className="h-4 w-4 text-warning" />
          <h2 className="font-display text-lg font-semibold">Training milestones</h2>
        </div>
        <ol className="relative space-y-4 border-l border-border pl-6">
          {milestones.map((m) => (
            <li key={m.week} className="relative">
              <span className="absolute -left-[29px] top-1 flex h-4 w-4 items-center justify-center rounded-full border border-border bg-card">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {m.week}
              </div>
              <div className="text-sm font-semibold">{m.label}</div>
              <div className="text-xs text-muted-foreground">{m.note}</div>
            </li>
          ))}
        </ol>
      </section>

      <p className="mt-6 text-center text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        Mock training data · wire to <code className="rounded bg-muted px-1.5 py-0.5">/api/fikable/admin/learning</code> when available
      </p>
    </main>
  );
}

function KpiCard({
  icon, label, value, delta, inverse = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: number;
  inverse?: boolean;
}) {
  const good = inverse ? delta < 0 : delta > 0;
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {icon} {label}
      </div>
      <div className="font-display text-3xl font-semibold">{value}</div>
      <div className={`mt-1 text-xs ${good ? "text-primary" : "text-danger"}`}>
        {good ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}% vs week 1
      </div>
    </div>
  );
}
