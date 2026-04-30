"use client";

import { PrimaryButton, SectionHeader } from "../components/primitives";

interface Props {
  isConnected: boolean;
  username?: string | null;
  onNext: () => void;
  onBack: () => void;
}

export default function AccountSection({ isConnected, username, onNext, onBack }: Props) {
  return (
    <div>
      <SectionHeader
        title="Let's connect your Instagram."
        subtitle="We'll pull your audit data and tailor the strategy to your real numbers."
      />

      <div className="bg-white border border-[#E9E3D8] rounded-2xl p-8 text-center">
        {isConnected ? (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#5B21B6] to-[#FB7185] flex items-center justify-center text-white text-3xl mb-4">
              ✓
            </div>
            <h3 className="text-xl font-semibold text-[#1F1B2E]">@{username ?? "your account"} is connected</h3>
            <p className="mt-2 text-sm text-[#544A6B]">You're good. Let's keep going.</p>
            <div className="mt-6 flex justify-center gap-3">
              <a
                href="/api/instagram/connect"
                className="text-xs text-[#544A6B] hover:text-[#1F1B2E] underline underline-offset-4 decoration-dotted self-center"
              >
                Reconnect a different account
              </a>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-[#F5F1EB] flex items-center justify-center text-3xl mb-4">
              📷
            </div>
            <h3 className="text-xl font-semibold text-[#1F1B2E]">Connect your Instagram account</h3>
            <p className="mt-2 text-sm text-[#544A6B] max-w-md mx-auto">
              We use your real performance data to build a strategy that fits your account — not a generic template.
            </p>
            <a
              href="/api/instagram/connect"
              className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-[#5B21B6] to-[#FB7185] text-white font-semibold px-6 py-3 rounded-full hover:opacity-95 active:scale-[0.98] transition-all"
            >
              <span>Connect Instagram</span>
              <span aria-hidden="true">→</span>
            </a>
            <p className="mt-4 text-xs text-[#8B829F]">Read-only access. We never post on your behalf.</p>
          </>
        )}
      </div>

      <div className="mt-12 flex justify-between">
        <PrimaryButton variant="ghost" onClick={onBack}>← Back</PrimaryButton>
        <PrimaryButton onClick={onNext} disabled={!isConnected}>
          {isConnected ? "Continue →" : "Connect to continue"}
        </PrimaryButton>
      </div>
    </div>
  );
}
