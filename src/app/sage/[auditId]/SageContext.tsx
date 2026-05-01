"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import type { AuditData, VideoItem } from "./lib/types";

export interface SageCtx {
  auditData: AuditData;
  isLoading: boolean;
  selectedVideo: VideoItem | null;
  setSelectedVideo: (v: VideoItem | null) => void;
  onUpgrade: () => void;
}

const Ctx = createContext<SageCtx | null>(null);

interface ProviderProps {
  children: ReactNode;
  auditData: AuditData;
  /** UX: minimum loading time so the audit feels like real computation */
  minLoadingMs?: number;
}

export function SageProvider({ children, auditData, minLoadingMs = 1500 }: ProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), minLoadingMs);
    return () => clearTimeout(t);
  }, [minLoadingMs]);

  const onUpgrade = () => {
    // Will eventually open a checkout / paywall modal. For now route to dashboard.
    window.location.href = "/dashboard";
  };

  return (
    <Ctx.Provider value={{ auditData, isLoading, selectedVideo, setSelectedVideo, onUpgrade }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSage(): SageCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSage must be inside <SageProvider>");
  return v;
}
