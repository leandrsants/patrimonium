import { Badge, EmptyState, Metric } from "@/components/ui/primitives";
import { OPERACAO_STEPS_DS, ONBOARDING_STEPS_DS, ASSINATURA_LABEL, ASSINATURA_ACCENT } from "@/lib/labels";
import type { Assinatura } from "@/lib/types";

function progresso(checklist: Record<string, boolean> | null, steps: { key: string; label: string }[]) {
  const done = steps.filter((s) => checklist?.[s.key]).length;
  const proximo = steps.find((s) => !checklist?.[s.key]);
  return { done, total: steps.length, proximo: proximo?.label ?? "Concluído" };
}

/** Visão operacional consolidada: cliente / etapa / próximo passo / status. */
export function OperacaoPanel({ assinaturas }: { assinaturas: Assinatura[] }) {
  const ativas = assinaturas.filter((a) => a.status !== "cancelado" && a.status !== "finalizado");
  const emOnboarding = ativas.filter((a) => a.status === "onboarding");

  if (ativas.length === 0) {
    return <EmptyState title="Nenhum cliente em operação" description="Clientes ativos e em onboarding aparecerão aqui com etapa atual, próximo passo e pendências." />;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Metric label="Em operação" value={String(ativas.length)} accent="smile" />
        <Metric label="Em onboarding" value={String(emOnboarding.length)} accent="warning" />
        <Metric label="Ativos" value={String(ativas.filter((a) => a.status === "ativo").length)} accent="positive" />
      </div>

      <div className="overflow-x-auto rounded-xl2 border border-line">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-raised text-2xs uppercase tracking-wider text-ink-faint">
              <th className="px-4 py-3 text-left font-semibold">Cliente</th>
              <th className="px-4 py-3 text-left font-semibold">Fase</th>
              <th className="px-4 py-3 text-left font-semibold">Progresso</th>
              <th className="px-4 py-3 text-left font-semibold">Próximo passo</th>
              <th className="px-4 py-3 text-right font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {ativas.map((a) => {
              const emOnb = a.status === "onboarding";
              const prog = emOnb ? progresso(a.checklist_onboarding, ONBOARDING_STEPS_DS) : progresso(a.checklist_entrega_trafego, OPERACAO_STEPS_DS);
              const travado = prog.done === 0;
              return (
                <tr key={a.id} className="border-b border-line/70 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{a.cliente?.nome ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-faint">{emOnb ? "Onboarding" : "Operação"}</td>
                  <td className="px-4 py-3">
                    <span className="text-ink-soft">{prog.done}/{prog.total}</span>
                    {travado ? <span className="ml-2 text-2xs text-negative">travado</span> : null}
                  </td>
                  <td className="px-4 py-3 text-ink-faint">{prog.proximo}</td>
                  <td className="px-4 py-3 text-right"><Badge accent={ASSINATURA_ACCENT[a.status]}>{ASSINATURA_LABEL[a.status]}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-2xs text-ink-dim">Abra o cliente em “Clientes e contratos” para atualizar onboarding e operação. Cliente “travado” = nenhuma etapa concluída.</p>
    </div>
  );
}
