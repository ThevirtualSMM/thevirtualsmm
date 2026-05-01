"use client";

import Image from "next/image";
import { useSage } from "../SageContext";
import { calculateScores } from "../lib/scoring";
import { CalendarIcon, ChatIcon, HeartIcon, InstagramCameraIcon, PeopleIcon, ShareIcon } from "./icons";
import BenchmarkPill from "./BenchmarkPill";
import CountUp from "./CountUp";

const COLORS = {
  border: "rgba(31,27,46,0.10)",
  card:   "#FFFFFF",
  bg:     "#F4F1EA",
  dark:   "#1F1B2E",
  muted:  "#7A7088",
  green:  "#b8ff57",
  pink:   "#ff4d8d",
  purple: "#b8a9ff",
  amber:  "#f0a500",
};

export default function ProfileHeaderCard() {
  const { auditData } = useSage();
  const p = auditData.profile;
  const scores = calculateScores(p);

  // Initials for fallback avatar
  const initials = p.username.replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase() || "??";

  const stats: { icon: React.ReactNode; value: number; label: string; format?: (n: number) => string; tag: ReturnType<typeof BenchmarkPill> }[] = [
    {
      icon:  <PeopleIcon style={{ color: COLORS.green }} />,
      value: p.followers,
      label: "Followers",
      tag:   <BenchmarkPill {...scores.followers} />,
    },
    {
      icon:  <HeartIcon style={{ color: COLORS.pink }} />,
      value: p.avgLikes,
      label: "Avg likes",
      tag:   <BenchmarkPill {...scores.likes} />,
    },
    {
      icon:  <ChatIcon style={{ color: COLORS.purple }} />,
      value: p.avgComments,
      label: "Avg comments",
      tag:   <BenchmarkPill {...scores.comments} />,
    },
    {
      icon:  <ShareIcon style={{ color: COLORS.amber }} />,
      value: p.avgShares,
      label: "Avg shares",
      tag:   <BenchmarkPill {...scores.shares} />,
    },
    {
      icon:  <CalendarIcon style={{ color: COLORS.amber }} />,
      value: Math.round(p.postsPerWeek * 10) / 10,
      label: "Posts / week",
      format: (n) => n.toFixed(1),
      tag:   <BenchmarkPill {...scores.postsPerWeek} />,
    },
  ];

  return (
    <div
      className="sage-fade-in-down flex items-center"
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 18,
        padding: "1.5rem 2rem",
        gap: "1.75rem",
      }}
    >
      {/* ── Avatar + IG badge ─────────────────────────────────────────── */}
      <div className="relative" style={{ width: 80, height: 80, flexShrink: 0 }}>
        <div
          className="rounded-full overflow-hidden"
          style={{
            width: 80, height: 80,
            border: `3px solid ${COLORS.green}`,
            background: "linear-gradient(135deg, #2a2640, #1F1B2E)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: COLORS.green,
            fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em",
          }}
        >
          {p.profilePhotoUrl ? (
            <Image src={p.profilePhotoUrl} alt={p.username} width={80} height={80} unoptimized />
          ) : (
            initials
          )}
        </div>
        {/* IG gradient badge */}
        <div
          className="absolute"
          style={{
            right: -2, bottom: -2, width: 22, height: 22, borderRadius: "50%",
            background: "linear-gradient(135deg, #6a11cb 0%, #c5507e 50%, #f0a500 100%)",
            border: "2px solid #fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff",
          }}
        >
          <InstagramCameraIcon width={11} height={11} />
        </div>
      </div>

      {/* ── Profile info ──────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, minWidth: 180, maxWidth: 230 }}>
        <div className="flex items-center gap-2 mb-1.5">
          <span style={{ color: COLORS.dark, fontSize: 16, fontWeight: 700 }}>@{p.username}</span>
        </div>
        <span
          className="inline-block"
          style={{
            background: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
            color: COLORS.muted,
            fontSize: 11,
            padding: "3px 12px",
            borderRadius: 999,
            marginBottom: 10,
          }}
        >
          {p.niche}
        </span>
        <p style={{ color: COLORS.muted, fontSize: 11, lineHeight: 1.5, margin: 0 }}>
          {p.bio}
        </p>
        <p style={{ color: "#bbb", fontSize: 10, marginTop: 8 }}>{p.followActivity}</p>
      </div>

      {/* ── Vertical divider ──────────────────────────────────────────── */}
      <div style={{ width: 1, alignSelf: "stretch", background: COLORS.border, margin: "4px 0" }} />

      {/* ── Stats strip ───────────────────────────────────────────────── */}
      <div className="flex" style={{ flex: 1, justifyContent: "space-evenly", alignItems: "center" }}>
        {stats.map((s, i) => (
          <div
            key={i}
            className="flex flex-col items-center"
            style={{
              padding: "0 12px",
              borderRight: i < stats.length - 1 ? `1px solid ${COLORS.border}` : "none",
              flex: 1,
              gap: 4,
            }}
          >
            {s.icon}
            <CountUp
              to={s.value}
              format={s.format}
              style={{ color: COLORS.dark, fontSize: 20, fontWeight: 700, lineHeight: 1.1 }}
            />
            <span style={{ color: COLORS.muted, fontSize: 10 }}>{s.label}</span>
            {s.tag}
          </div>
        ))}
      </div>
    </div>
  );
}
