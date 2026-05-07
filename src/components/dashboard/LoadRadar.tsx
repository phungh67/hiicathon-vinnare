import { PolarAngleAxis, PolarGrid, Radar, RadarChart as RC, ResponsiveContainer } from "recharts";

interface Props {
  data: { meeting_burden_hrs: number; interruption_volume: number; busy_work_pct: number; switches_per_hr: number; kudos: number };
}

export function LoadRadar({ data }: Props) {
  // Normalize each metric to 0–100
  const points = [
    { axis: "Meeting hrs", value: Math.min(100, (data.meeting_burden_hrs / 8) * 100) },
    { axis: "Interruptions", value: Math.min(100, (data.interruption_volume / 25) * 100) },
    { axis: "Busy work", value: data.busy_work_pct },
    { axis: "Context switches", value: Math.min(100, (data.switches_per_hr / 20) * 100) },
    { axis: "Recognition", value: Math.min(100, 100 - data.kudos * 25) },
  ];
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RC data={points} outerRadius="78%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
          <Radar name="Stress signals" dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.35} strokeWidth={2} />
        </RC>
      </ResponsiveContainer>
    </div>
  );
}
