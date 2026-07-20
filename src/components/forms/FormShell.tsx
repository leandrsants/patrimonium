"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { ActionResult } from "@/lib/actions";

export function useFormSubmit(onDone?: () => void) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<ActionResult>) {
    setPending(true);
    setError(null);
    try {
      const res = await fn();
      if (!res.ok) {
        setError(res.error ?? "Erro ao salvar.");
        setPending(false);
        return false;
      }
      router.refresh();
      onDone?.();
      setPending(false);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
      setPending(false);
      return false;
    }
  }

  return { pending, error, run };
}

export function FormFields({ children }: { children: ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

export function FormFooter({
  pending,
  error,
  onSubmit,
  submitLabel = "Salvar",
  onCancel,
}: {
  pending: boolean;
  error: string | null;
  onSubmit: () => void;
  submitLabel?: string;
  onCancel?: () => void;
}) {
  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-lg2 border border-negative/30 bg-negative-dim px-3 py-2 text-xs text-negative">{error}</p>
      ) : null}
      <div className="flex items-center justify-end gap-2">
        {onCancel ? (
          <Button variant="ghost" onClick={onCancel} type="button">
            Cancelar
          </Button>
        ) : null}
        <Button variant="primary" onClick={onSubmit} disabled={pending} type="button">
          {pending ? "Salvando…" : submitLabel}
        </Button>
      </div>
    </div>
  );
}
