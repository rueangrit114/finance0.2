"use client";
import { baht } from "@/lib/format";

export const PALETTE = [
  "var(--accent)", "var(--accent2)", "#ef6b6b", "#f2b84b", "#7bd88f",
  "#6ea8fe", "#c792ea", "#ff9e64",
];

export function BarChart({
  data,
}: {
  data: { label: string; income: number; expense: number }[];
}) {
  const W = 320, H = 150, pad = { l: 34, r: 6, t: 8, b: 20 };
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  const nice = Math.pow(10, Math.floor(Math.log10(max)));
  const top = Math.ceil(max / nice) * nice;
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const gw = iw / data.length, bw = Math.min(14, gw / 3);
  const y = (v: number) => pad.t + ih - (v / top) * ih;
  const ticks = [0, 0.5, 1].map((t) => t * top);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="กราฟรายรับเทียบรายจ่าย">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeDasharray="3 3" />
          <text x={pad.l - 4} y={y(t) + 3} textAnchor="end" fontSize="8" fill="var(--muted)">
            {t >= 1000 ? `${Math.round(t / 1000)}k` : t}
          </text>
        </g>
      ))}
      {data.map((d, i) => {
        const cx = pad.l + gw * i + gw / 2;
        return (
          <g key={d.label + i}>
            <rect x={cx - bw - 1} y={y(d.income)} width={bw} height={Math.max(0, pad.t + ih - y(d.income))} rx="2" fill="var(--accent)">
              <title>{`${d.label} รายรับ ${baht(d.income)}`}</title>
            </rect>
            <rect x={cx + 1} y={y(d.expense)} width={bw} height={Math.max(0, pad.t + ih - y(d.expense))} rx="2" fill="var(--accent2)">
              <title>{`${d.label} รายจ่าย ${baht(d.expense)}`}</title>
            </rect>
            <text x={cx} y={H - 6} textAnchor="middle" fontSize="8.5" fill="var(--muted)">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function Donut({
  slices, size = 110, thickness = 16, center,
}: {
  slices: { label: string; value: number; color?: string }[];
  size?: number; thickness?: number; center?: string;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2, c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="กราฟโดนัท">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface2)" strokeWidth={thickness} />
      {total > 0 &&
        slices.map((s, i) => {
          const len = (s.value / total) * c;
          const el = (
            <circle
              key={s.label}
              cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={s.color ?? PALETTE[i % PALETTE.length]}
              strokeWidth={thickness}
              strokeDasharray={`${Math.max(0, len - 1.5)} ${c - Math.max(0, len - 1.5)}`}
              strokeDashoffset={-acc}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            >
              <title>{`${s.label}: ${baht(s.value)} (${Math.round((s.value / total) * 100)}%)`}</title>
            </circle>
          );
          acc += len;
          return el;
        })}
      {center && (
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize={size / 6} fontWeight="700" fill="var(--text)">
          {center}
        </text>
      )}
    </svg>
  );
}

export function TrendLine({ points }: { points: { label: string; value: number }[] }) {
  const W = 320, H = 90, p = 10;
  const vals = points.map((x) => x.value);
  const min = Math.min(0, ...vals), max = Math.max(1, ...vals);
  const x = (i: number) => p + (i * (W - 2 * p)) / Math.max(1, points.length - 1);
  const y = (v: number) => H - 16 - ((v - min) / (max - min || 1)) * (H - 30);
  const d = points.map((pt, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(pt.value).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="แนวโน้มเงินออมสุทธิ">
      <defs>
        <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity=".35" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={p} x2={W - p} y1={y(0)} y2={y(0)} stroke="var(--border)" strokeDasharray="3 3" />
      <path d={`${d} L${x(points.length - 1)},${H - 16} L${x(0)},${H - 16} Z`} fill="url(#trendFill)" />
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((pt, i) => (
        <g key={pt.label + i}>
          <circle cx={x(i)} cy={y(pt.value)} r="2.8" fill="var(--accent2)">
            <title>{`${pt.label}: ${baht(pt.value)}`}</title>
          </circle>
          <text x={x(i)} y={H - 3} textAnchor="middle" fontSize="8.5" fill="var(--muted)">{pt.label}</text>
        </g>
      ))}
    </svg>
  );
}
