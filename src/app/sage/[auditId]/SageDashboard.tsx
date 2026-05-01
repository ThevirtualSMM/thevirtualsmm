"use client";

import { useSage } from "./SageContext";
import Sidebar from "./components/Sidebar";
import ProfileHeaderCard from "./components/ProfileHeaderCard";
import EngagementBanner from "./components/EngagementBanner";
import VideosCard from "./components/VideosCard";
import RepeatOpportunityCard from "./components/RepeatOpportunityCard";
import CreatorsCard from "./components/CreatorsCard";
import LockedFullAudit from "./components/LockedFullAudit";
import VideoModal from "./components/VideoModal";
import Skeleton from "./components/Skeleton";

const COLORS = {
  bg:     "#F4F1EA",
  border: "rgba(31,27,46,0.10)",
};

export default function SageDashboard() {
  const { auditData, isLoading } = useSage();

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#EFE9DD",
        padding: 24,
        minWidth: 1200,
      }}
    >
      <div
        className="flex"
        style={{
          background: COLORS.bg,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 20,
          overflow: "hidden",
          minHeight: "calc(100vh - 48px)",
          maxWidth: "100%",
        }}
      >
        {/* ── Fixed sidebar ─────────────────────────────────────── */}
        <Sidebar />

        {/* ── Main content area (scrolls) ───────────────────────── */}
        <main
          className="flex-1"
          style={{
            background: COLORS.bg,
            padding: "1.25rem",
            overflowY: "auto",
            maxHeight: "calc(100vh - 48px)",
          }}
        >
          {isLoading ? (
            <Skeleton />
          ) : (
            <div className="space-y-3">
              {/* Section 1 — Profile header */}
              <ProfileHeaderCard />

              {/* Section 2 — Engagement banner */}
              <EngagementBanner />

              {/* Section 3 — Two-column grid */}
              <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                {/* Left column */}
                <VideosCard
                  title="Top 3 most viewed reels"
                  videos={auditData.topByViews}
                  variant="scores"
                  baseDelay={0.5}
                />

                {/* Right column */}
                <div className="space-y-3">
                  <VideosCard
                    title="Top 3 highest engagement"
                    videos={auditData.topByEngagement}
                    variant="engagement"
                    baseDelay={0.6}
                  />
                  <RepeatOpportunityCard />
                  <CreatorsCard />
                  <LockedFullAudit />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <VideoModal />
    </div>
  );
}
