import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  AlertTriangle, ArrowLeft, Brain, CheckCircle2, RefreshCw,
  Server, ShieldAlert, Sparkles, Target, Users,
} from "lucide-react";

export const Route = createFileRoute("/suggestions")({
  head: () => ({
    meta: [
      { title: "Burnout Pattern Playbook — Fikable HR" },
      { name: "description", content: "12 canonical burnout patterns with suggested interventions and AI-generated manager scripts." },
    ],
  }),
  component: SuggestionsPage,
});

interface AICoaching {
  manager_script: string;
  first_action: string;
}
interface Pattern {
  id: number;
  pattern: string;
  risk_dimension: string;
  signals: string;
  eri_level: string;
  suggested_interventions: string[];
  action_type: string;
  audience: string;
  ai_coaching?: AICoaching;
}
interface Payload {
  status: string;
  count: number;
  patterns: Pattern[];
}

const DEFAULT_API = "http://localhost:8000";
const STORAGE_KEY = "fikable_api_base";

async function fetchSuggestions(base: string, enrich: boolean): Promise<Payload> {
  const url = `${base.replace(/\/$/, "")}/api/fikable/admin/suggestions${enrich ? "?enrich=true" : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Backend ${res.status}: ${await res.text()}`);
  return res.json();
}

const eriColor = (level: string): string => {
  const l = level.toLowerCase();
  if (l.includes("red")) return "var(--danger)";
  if (l.includes("orange")) return "var(--warning)";
  if (l.includes("yellow")) return "var(--accent)";
  return "var(--muted-foreground)";
};

function SuggestionsPage() {
  const [apiBase, setApiBase] = useState(DEFAULT_API);
  const [enrich, setEnrich] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) setApiBase(stored);
  }, []);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["suggestions", apiBase, enrich],
    queryFn: () => fetchSuggestions(apiBase, enrich),
    retry: 0,
    refetchOnWindowFocus: false,
  });

  const dimensions = data
    ? Array.from(new Set(data.patterns.map((p) => p.risk_dimension)))
    : [];

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
            Fikable · Burnout Pattern Playbook
          </div>
          <h1 className="font-display text-5xl font-semibold tracking-tight md:text-6xl">
            12 stress patterns, <span className="italic text-accent">12 ways to act.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            Canonical burnout patterns mapped to suggested interventions. Toggle{" "}
            <em>AI coaching</em> to have the local LLM draft a manager script per pattern.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={enrich}
              onChange={(e) => setEnrich(e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--accent)]"
            />
            Enrich with AI coaching (slower)
          </label>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Loading…" : "Reload"}
          </button>
        </div>
      </header>

      <div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card/50 p-4 text-xs text-muted-foreground">
        <Server className="h-4 w-4 text-primary" />
        <span>Backend: <code className="rounded bg-muted px-1.5 py-0.5">{apiBase}/api/fikable/admin/suggestions</code></span>
        {data && <span>· {data.count} patterns loaded</span>}
      </div>

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl border border-border bg-card/50" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-danger/40 bg-danger/5 p-6 text-sm">
          <div className="mb-2 flex items-center gap-2 font-semibold text-danger">
            <AlertTriangle className="h-4 w-4" /> Could not reach backend
          </div>
          <p className="text-xs text-muted-foreground">{(error as Error).message}</p>
        </div>
      )}

      {data && (
        <>
          {/* Dimension legend */}
          <div className="mb-6 flex flex-wrap gap-2">
            {dimensions.map((d) => (
              <span
                key={d}
                className="rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground"
              >
                {d}
              </span>
            ))}
          </div>

          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {data.patterns.map((p) => (
              <PatternCard key={p.id} pattern={p} />
            ))}
          </section>
        </>
      )}
    </main>
  );
}

function PatternCard({ pattern: p }: { pattern: Pattern }) {
  const color = eriColor(p.eri_level);
  return (
    <article
      className="glass-card flex flex-col gap-4 rounded-2xl p-6"
      style={{
        borderLeft: `3px solid ${color}`,
      }}
    >
      <header>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            #{p.id} · {p.risk_dimension}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{
              background: `color-mix(in oklab, ${color} 18%, transparent)`,
              color,
            }}
          >
            {p.eri_level}
          </span>
        </div>
        <h2 className="font-display text-xl font-semibold leading-tight">{p.pattern}</h2>
      </header>

      <div>
        <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <Brain className="h-3 w-3" /> Signals
        </div>
        <p className="text-xs text-foreground/80">{p.signals}</p>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <Target className="h-3 w-3" /> Suggested interventions
        </div>
        <ul className="space-y-1.5">
          {p.suggested_interventions.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-foreground/90">
              <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>

      {p.ai_coaching && (
        <div
          className="rounded-xl border border-border/60 p-3"
          style={{ background: "color-mix(in oklab, var(--accent) 8%, var(--card))" }}
        >
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-accent">
            <Sparkles className="h-3 w-3" /> AI manager script
          </div>
          <p className="mb-2 text-xs italic text-foreground/90">
            “{p.ai_coaching.manager_script}”
          </p>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">First action</div>
          <p className="text-xs font-medium text-foreground">{p.ai_coaching.first_action}</p>
        </div>
      )}

      <footer className="mt-auto flex items-center justify-between border-t border-border/50 pt-3 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        <span className="flex items-center gap-1.5"><ShieldAlert className="h-3 w-3" /> {p.action_type}</span>
        <span className="flex items-center gap-1.5"><Users className="h-3 w-3" /> {p.audience}</span>
      </footer>
    </article>
  );
}
