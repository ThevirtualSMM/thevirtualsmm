// Custom SVG icons. Single-file so styling stays in one place.
// All icons accept className/style; default stroke = currentColor so the
// nav hover states work via CSS.

import type { SVGProps } from "react";

const base: SVGProps<SVGSVGElement> = {
  width: 16, height: 16, viewBox: "0 0 24 24",
  fill: "none", stroke: "currentColor",
  strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round",
};

export function GridIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3"  y="3"  width="7" height="7" rx="1.5"/>
      <rect x="14" y="3"  width="7" height="7" rx="1.5"/>
      <rect x="3"  y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  );
}

export function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="11" width="16" height="10" rx="2"/>
      <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
    </svg>
  );
}

export function DocLinesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
      <path d="M14 3v6h6"/>
      <path d="M8 13h8M8 17h6"/>
    </svg>
  );
}

export function LineChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3 3v18h18"/>
      <path d="M7 14l4-4 3 3 6-7"/>
    </svg>
  );
}

export function SparkleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

// Profile-card stat icons — coloured per-stat, so they accept stroke color.
export function PeopleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} width={20} height={20} {...props}>
      <circle cx="9"  cy="8" r="3.5"/>
      <path d="M2.5 19c0-3 3-5 6.5-5s6.5 2 6.5 5"/>
      <circle cx="17" cy="9" r="2.5"/>
      <path d="M21.5 18c0-2.2-1.8-3.6-4.5-3.6"/>
    </svg>
  );
}

export function HeartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} width={20} height={20} {...props}>
      <path d="M20.4 6.6a5 5 0 0 0-7-.7L12 7.1l-1.4-1.2a5 5 0 1 0-6.6 7.4L12 21l8-7.7a5 5 0 0 0 .4-6.7z"/>
    </svg>
  );
}

export function ChatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} width={20} height={20} {...props}>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"/>
    </svg>
  );
}

export function ShareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} width={20} height={20} {...props}>
      <path d="M3 12l16-8-4 16-4-7-8-1z"/>
    </svg>
  );
}

export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} width={20} height={20} {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2"/>
      <path d="M3 10h18M8 3v4M16 3v4"/>
    </svg>
  );
}

export function CrownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} width={14} height={14} strokeWidth={1.8} {...props}>
      <path d="M3 7l3.5 3 5.5-6 5.5 6L21 7l-2 11H5L3 7z"/>
    </svg>
  );
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} width={11} height={11} strokeWidth={2.5} {...props}>
      <path d="M5 12l4.5 4.5L20 6"/>
    </svg>
  );
}

export function PlayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M7 4l14 8-14 8V4z"/>
    </svg>
  );
}

export function InstagramCameraIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor"/>
    </svg>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2.2} {...props}>
      <path d="M6 6l12 12M18 6L6 18"/>
    </svg>
  );
}
