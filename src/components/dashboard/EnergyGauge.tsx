interface Props {
  value: number;
  label: string;
  inverse?: boolean; // true = lower is better (cognitive load)
  size?: number;
}

export function EnergyGauge({ value, label, inverse = false, size = 220 }: Props) {
  const radius = size / 2 - 16;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, value));
  const offset = circumference - (pct / 100) * circumference;

  const tone = inverse
    ? pct > 70 ? "var(--danger)" : pct > 45 ? "var(--warning)" : "var(--success)"
    : pct > 65 ? "var(--success)" : pct > 40 ? "var(--warning)" : "var(--danger)";

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke="var(--muted)" strokeWidth={14} fill="none"
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={tone} strokeWidth={14} fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s ease, stroke 0.4s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-5xl font-semibold tabular-nums" style={{ color: tone }}>
            {Math.round(pct)}
          </span>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1">/ 100</span>
        </div>
      </div>
      <span className="mt-4 text-sm font-medium text-foreground/80">{label}</span>
    </div>
  );
}
