"use client";

import { useTheme } from "./ThemeProvider";
import { CheckIcon } from "./icons";
import type { ThemePreference } from "@/lib/theme";

type Palette = { bg: string; card: string; line: string; ink: string; sub: string; accent: string };

// Cores fixas (não dependem do tema ativo) para o preview sempre mostrar o alvo.
const PALETTES: Record<"light" | "dark", Palette> = {
  light: { bg: "#F7F8FA", card: "#FFFFFF", line: "#E2E5EA", ink: "#181B21", sub: "#747B86", accent: "#A57C1C" },
  dark: { bg: "#0A0B0E", card: "#101216", line: "#21242B", ink: "#F3F4F6", sub: "#70747C", accent: "#CDA349" },
};

function PreviewFace({ p }: { p: Palette }) {
  return (
    <div className="h-full w-full p-2.5" style={{ backgroundColor: p.bg }}>
      <div className="h-full w-full rounded-md p-2" style={{ backgroundColor: p.card, border: `1px solid ${p.line}` }}>
        <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: p.accent }} />
        <div className="mt-2 h-1.5 w-12 rounded-full" style={{ backgroundColor: p.ink }} />
        <div className="mt-1.5 h-1.5 w-9 rounded-full" style={{ backgroundColor: p.sub }} />
      </div>
    </div>
  );
}

function MiniPreview({ variant }: { variant: "light" | "dark" | "system" }) {
  if (variant === "system") {
    return (
      <div className="relative h-full w-full overflow-hidden">
        <div className="absolute inset-0" style={{ clipPath: "polygon(0 0, 56% 0, 44% 100%, 0 100%)" }}>
          <PreviewFace p={PALETTES.light} />
        </div>
        <div className="absolute inset-0" style={{ clipPath: "polygon(56% 0, 100% 0, 100% 100%, 44% 100%)" }}>
          <PreviewFace p={PALETTES.dark} />
        </div>
      </div>
    );
  }
  return <PreviewFace p={PALETTES[variant]} />;
}

const CARDS: { value: ThemePreference; label: string; variant: "light" | "dark" | "system" }[] = [
  { value: "light", label: "Claro", variant: "light" },
  { value: "dark", label: "Escuro", variant: "dark" },
  { value: "system", label: "Sistema", variant: "system" },
];

export function AppearanceSettings() {
  const { preference, resolved, setPreference } = useTheme();

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {CARDS.map((c) => {
          const selected = preference === c.value;
          return (
            <button
              key={c.value}
              onClick={() => setPreference(c.value)}
              aria-pressed={selected}
              className={`group overflow-hidden rounded-xl2 border text-left transition-colors ${
                selected ? "border-vision" : "border-line hover:border-line-strong"
              }`}
            >
              <div className="h-24 w-full border-b border-line">
                <MiniPreview variant={c.variant} />
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className={`text-sm font-medium ${selected ? "text-ink" : "text-ink-soft"}`}>{c.label}</span>
                {selected ? <span className="text-vision">{<CheckIcon />}</span> : null}
              </div>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-2xs text-ink-dim">
        {preference === "system"
          ? `Seguindo o sistema operacional — atualmente ${resolved === "dark" ? "escuro" : "claro"}.`
          : "A escolha é aplicada na hora e mantida entre sessões."}
      </p>
    </div>
  );
}
