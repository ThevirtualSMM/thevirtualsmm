"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import "./sage.css";

interface Props {
  status: string;
  errorMessage: string | null;
}

const COLORS = { dark: "#1F1B2E", muted: "#7A7088", green: "#b8ff57", pink: "#ff4d8d" };

export default function SageInProgress({ status, errorMessage }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (status === "failed") return;
    const id = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(id);
  }, [status, router]);

  if (status === "failed") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#EFE9DD", padding: 24 }}
      >
        <div className="text-center max-w-sm">
          <div
            className="mx-auto flex items-center justify-center mb-6"
            style={{ width: 48, height: 48, borderRadius: "50%", border: `2px solid ${COLORS.pink}`, color: COLORS.pink, fontWeight: 700, fontSize: 20 }}
          >
            !
          </div>
          <h2 style={{ color: COLORS.dark, fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Audit failed</h2>
          <p style={{ color: COLORS.muted, fontSize: 13 }}>{errorMessage || "Something went wrong. Try again."}</p>
          <a
            href="/"
            className="inline-block mt-6"
            style={{ color: COLORS.dark, fontSize: 13, textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 4 }}
          >
            ← Back to home
          </a>
        </div>
      </div>
    );
  }

  const message =
    status === "scraping"  ? "Scraping your last 30 days of posts…" :
    status === "analyzing" ? "Asking AI what's working…" :
                              "Spinning up your audit…";

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#EFE9DD", padding: 24 }}
    >
      <div className="text-center">
        <div className="flex items-center justify-center gap-1.5 mb-4 h-10">
          {[22, 38, 14, 30, 40, 18, 34, 24, 28].map((peak, i) => (
            <span
              key={i}
              className="sage-wave-bar"
              style={{
                width: 4, borderRadius: 999, background: COLORS.green,
                ["--peak" as string]: `${peak}px`,
                ["--delay" as string]: `${(i % 5) * 0.12}s`,
                height: "8px",
              }}
            />
          ))}
        </div>
        <h2 style={{ color: COLORS.dark, fontSize: 16, fontWeight: 600 }}>Running your audit</h2>
        <p style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>{message}</p>
        <p style={{ color: "#bbb", fontSize: 10, marginTop: 16 }}>
          This usually takes 1–2 minutes. The page refreshes automatically.
        </p>
      </div>
    </div>
  );
}
