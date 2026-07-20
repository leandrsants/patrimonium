"use client";

import { useState, type ReactNode } from "react";

export function Tabs({ tabs, initial = 0 }: { tabs: { label: string; content: ReactNode }[]; initial?: number }) {
  const [active, setActive] = useState(initial);
  return (
    <div>
      <div className="mb-6 inline-flex gap-1 rounded-lg2 border border-line bg-surface p-1">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActive(i)}
            className={`rounded-lg2 px-4 py-1.5 text-sm font-medium transition-colors ${
              i === active ? "bg-surface-hover text-ink shadow-panel" : "text-ink-faint hover:text-ink-soft"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="animate-fade-in">{tabs[active].content}</div>
    </div>
  );
}

export function SegmentedControl({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="inline-flex gap-1 rounded-lg2 border border-line bg-surface p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
            value === o.value ? "bg-surface-hover text-ink" : "text-ink-faint hover:text-ink-soft"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
