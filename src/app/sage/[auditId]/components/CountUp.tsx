"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  to: number;
  durationMs?: number;
  format?: (n: number) => string;
  className?: string;
  style?: React.CSSProperties;
}

/** Counts up from 0 → target with ease-out cubic. */
export default function CountUp({ to, durationMs = 1200, format, className, style }: Props) {
  const [v, setV] = useState(0);
  const start = useRef<number | null>(null);

  useEffect(() => {
    let raf = 0;
    const step = (t: number) => {
      if (start.current == null) start.current = t;
      const elapsed = t - start.current;
      const p = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(to * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, durationMs]);

  const display = format
    ? format(Math.round(v))
    : Math.round(v).toLocaleString();
  return <span className={className} style={style}>{display}</span>;
}
