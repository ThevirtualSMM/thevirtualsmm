"use client";

import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

// ── Color tokens (also used inline by other components) ─────────────────────
export const TOKENS = {
  bg:        "#FAF7F2",
  card:      "#FFFFFF",
  ink:       "#1F1B2E",
  inkSoft:   "#544A6B",
  inkMuted:  "#8B829F",
  purple:    "#5B21B6",
  purpleHi:  "#7C3AED",
  coral:     "#FB7185",
  coralHi:   "#FB923C",
  cream:     "#F5F1EB",
  border:    "#E9E3D8",
} as const;

// ── PrimaryButton ───────────────────────────────────────────────────────────
interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline";
}

export function PrimaryButton({
  variant = "primary",
  className = "",
  children,
  ...rest
}: PrimaryButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-[#1F1B2E] text-white hover:bg-[#5B21B6] active:scale-[0.98]"
      : variant === "outline"
      ? "border border-[#E9E3D8] text-[#1F1B2E] hover:bg-[#F5F1EB]"
      : "text-[#544A6B] hover:text-[#1F1B2E]";
  return (
    <button className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}

// ── ChoiceCard ──────────────────────────────────────────────────────────────
interface ChoiceCardProps {
  icon?: ReactNode;
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  size?: "sm" | "md" | "lg";
}

export function ChoiceCard({ icon, label, description, selected, onClick, size = "md" }: ChoiceCardProps) {
  const padding = size === "lg" ? "p-6" : size === "sm" ? "p-3" : "p-5";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative text-left rounded-2xl border-2 ${padding} transition-all ${
        selected
          ? "border-[#5B21B6] bg-white shadow-[0_8px_24px_-12px_rgba(91,33,182,0.4)]"
          : "border-[#E9E3D8] bg-white hover:border-[#7C3AED]/40 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_-6px_rgba(31,27,46,0.15)]"
      }`}
    >
      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#5B21B6] flex items-center justify-center text-white text-[10px]">
          ✓
        </div>
      )}
      {icon && <div className="text-2xl mb-2">{icon}</div>}
      <div className={`font-semibold ${size === "lg" ? "text-lg" : "text-sm"} text-[#1F1B2E]`}>{label}</div>
      {description && (
        <div className={`mt-1 ${size === "lg" ? "text-sm" : "text-xs"} text-[#544A6B] leading-snug`}>
          {description}
        </div>
      )}
    </button>
  );
}

// ── Chip (pill multi-select) ────────────────────────────────────────────────
interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function Chip({ label, selected, onClick, disabled }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
        selected
          ? "bg-[#1F1B2E] text-white"
          : disabled
          ? "bg-white border border-[#E9E3D8] text-[#8B829F] cursor-not-allowed"
          : "bg-white border border-[#E9E3D8] text-[#1F1B2E] hover:border-[#5B21B6]"
      }`}
    >
      {label}
    </button>
  );
}

// ── TextField ───────────────────────────────────────────────────────────────
interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  charLimit?: number;
  value: string;
}

export function TextField({ label, helper, charLimit, value, onChange, ...rest }: TextFieldProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-[#1F1B2E]">{label}</label>}
      <input
        type="text"
        value={value}
        onChange={onChange}
        maxLength={charLimit}
        className="w-full rounded-xl border border-[#E9E3D8] bg-white px-4 py-3 text-sm text-[#1F1B2E] placeholder:text-[#8B829F] focus:outline-none focus:border-[#5B21B6] focus:ring-2 focus:ring-[#5B21B6]/15 transition-all"
        {...rest}
      />
      <div className="flex justify-between text-xs">
        {helper ? <span className="text-[#8B829F]">{helper}</span> : <span />}
        {charLimit && <span className="text-[#8B829F] tabular-nums">{value.length} / {charLimit}</span>}
      </div>
    </div>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helper?: string;
  charLimit?: number;
  value: string;
}

export function TextArea({ label, helper, charLimit, value, onChange, ...rest }: TextAreaProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-[#1F1B2E]">{label}</label>}
      <textarea
        value={value}
        onChange={onChange}
        maxLength={charLimit}
        rows={3}
        className="w-full rounded-xl border border-[#E9E3D8] bg-white px-4 py-3 text-sm text-[#1F1B2E] placeholder:text-[#8B829F] focus:outline-none focus:border-[#5B21B6] focus:ring-2 focus:ring-[#5B21B6]/15 transition-all resize-none"
        {...rest}
      />
      <div className="flex justify-between text-xs">
        {helper ? <span className="text-[#8B829F]">{helper}</span> : <span />}
        {charLimit && <span className="text-[#8B829F] tabular-nums">{value.length} / {charLimit}</span>}
      </div>
    </div>
  );
}

// ── SectionHeader ───────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl md:text-4xl font-bold text-[#1F1B2E] tracking-tight leading-tight">
        {title}
      </h1>
      <p className="mt-2 text-base text-[#544A6B]">{subtitle}</p>
    </div>
  );
}

// ── Question label ──────────────────────────────────────────────────────────
export function QuestionLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-[#1F1B2E] uppercase tracking-wider mb-3">
      {children}
    </h3>
  );
}
