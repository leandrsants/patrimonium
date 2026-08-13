"use client";

import type { ReactNode } from "react";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-2xs font-medium uppercase tracking-wide text-ink-faint">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-2xs text-ink-dim">{hint}</span> : null}
    </label>
  );
}

const baseInput =
  "w-full rounded-lg2 border border-line bg-surface-input px-3 py-2 text-sm text-ink placeholder:text-ink-dim outline-none transition-colors focus:border-line-strong focus:ring-2 focus:ring-ink/10";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${baseInput} ${props.className ?? ""}`} />;
}

export function MoneyInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-faint">R$</span>
      <input
        inputMode="decimal"
        value={value}
        placeholder={placeholder ?? "0,00"}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.,]/g, ""))}
        className={`${baseInput} pl-9 tnum`}
      />
    </div>
  );
}

export function DateInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="date" {...props} className={`${baseInput} ${props.className ?? ""}`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} rows={props.rows ?? 3} className={`${baseInput} resize-none ${props.className ?? ""}`} />;
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`${baseInput} appearance-none bg-[right_0.75rem_center] bg-no-repeat pr-9`}>
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-surface-raised">
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Converte "1.234,56" ou "1234.56" em number. */
export function parseMoney(v: string): number {
  if (!v) return 0;
  const cleaned = v.replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}
