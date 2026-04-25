"use client";

interface Props {
  score: number;
  label: string;
  size?: "sm" | "lg";
}

export default function ScoreGauge({ score, label, size = "lg" }: Props) {
  const s = Math.max(0, Math.min(100, score));
  const color = s >= 70 ? "#22c55e" : s >= 40 ? "#eab308" : "#ef4444";
  const isLg = size === "lg";
  const w = isLg ? 160 : 90;
  const h = isLg ? 100 : 56;
  const cx = w / 2;
  const cy = isLg ? 85 : 48;
  const r = isLg ? 60 : 34;
  const sw = isLg ? 12 : 7;
  const fs = isLg ? 24 : 13;
  const fsSub = isLg ? 11 : 9;

  const lx = cx - r;
  const rx = cx + r;

  return (
    <div className="flex flex-col items-center">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <path
          d={`M ${lx},${cy} A ${r},${r} 0 0,0 ${rx},${cy}`}
          fill="none"
          stroke="#262626"
          strokeWidth={sw}
          strokeLinecap="round"
        />
        <path
          d={`M ${lx},${cy} A ${r},${r} 0 0,0 ${rx},${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={String(1 - s / 100)}
        />
        <text
          x={cx}
          y={cy - (isLg ? 14 : 8)}
          textAnchor="middle"
          fill="white"
          fontSize={fs}
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          {Math.round(s)}
        </text>
        <text
          x={cx}
          y={cy + (isLg ? 4 : 2)}
          textAnchor="middle"
          fill="#737373"
          fontSize={fsSub}
          fontFamily="system-ui, sans-serif"
        >
          {label}
        </text>
      </svg>
    </div>
  );
}
