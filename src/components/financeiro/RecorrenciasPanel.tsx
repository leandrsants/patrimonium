"use client";

import { useState } from "react";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Select } from "@/components/ui/fields";
import { NovaRecorrenciaButton } from "@/components/actions/QuickButtons";
import { useFormSubmit } from "@/components/forms/FormShell";
import { gerarLancamentoRecorrente } from "@/lib/actions";
import { formatBRL, formatDateBR } from "@/lib/format";
import { contaOptions, type FormOptions } from "@/components/forms/options";
import type { DespesaRecorrente } from "@/lib/types";

export function RecorrenciasPanel({
  recorrencias,
  options,
  empresasMap,
}: {
  recorrencias: DespesaRecorrente[];
  options: FormOptions;
  empresasMap: Record<string, { nome: string }>;
}) {
  const { run } = useFormSubmit();
  const [lancar, setLancar] = useState<DespesaRecorrente | null>(null);
  const [conta, setConta] = useState(options.contas[0]?.id ?? "");

  if (recorrencias.length === 0) {
    return (
      <EmptyState
        title="Nenhuma despesa recorrente"
        description="Cadastre despesas recorrentes (Magnific, domínio, ferramentas). Não geramos meses futuros em massa — apenas a próxima data, e cada competência é lançada individualmente."
        cta={<NovaRecorrenciaButton options={options} />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <NovaRecorrenciaButton options={options} />
      </div>
      <div className="overflow-x-auto rounded-xl2 border border-line">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-raised text-2xs uppercase tracking-wider text-ink-faint">
              <th className="px-4 py-3 text-left font-semibold">Nome</th>
              <th className="px-4 py-3 text-left font-semibold">Periodicidade</th>
              <th className="px-4 py-3 text-left font-semibold">Próximo vencimento</th>
              <th className="px-4 py-3 text-left font-semibold">Classificação</th>
              <th className="px-4 py-3 text-right font-semibold">Valor</th>
              <th className="px-4 py-3 text-right font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {recorrencias.map((r) => (
              <tr key={r.id} className="border-b border-line/70 last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{r.nome}</td>
                <td className="px-4 py-3 text-ink-faint">{r.periodicidade === "mensal" ? "Mensal" : "Anual"}</td>
                <td className="px-4 py-3 text-ink-faint">{formatDateBR(r.proxima_data_vencimento)}</td>
                <td className="px-4 py-3 text-ink-faint">{r.empresa_id ? empresasMap[r.empresa_id]?.nome ?? "—" : "Pessoal"}</td>
                <td className="px-4 py-3 text-right tnum text-ink-soft">{formatBRL(r.valor)}</td>
                <td className="px-4 py-3 text-right">
                  {r.status === "ativo" ? (
                    <button onClick={() => { setLancar(r); }} className="text-2xs font-medium text-vision hover:underline">Lançar</button>
                  ) : (
                    <Badge accent="neutral">{r.status}</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer open={!!lancar} onClose={() => setLancar(null)} title="Lançar competência" description={lancar?.nome}>
        {lancar ? (
          <div className="space-y-5">
            <p className="text-sm text-ink-faint">
              Lançar a competência de <span className="text-ink">{formatDateBR(lancar.proxima_data_vencimento)}</span> no valor de{" "}
              <span className="tnum text-ink">{formatBRL(lancar.valor)}</span>. A próxima data avançará automaticamente.
            </p>
            <Field label="Conta *">
              <Select value={conta} onChange={setConta} options={contaOptions(options)} placeholder="Selecionar…" />
            </Field>
            <div className="flex justify-end">
              <Button variant="primary" onClick={async () => { await run(() => gerarLancamentoRecorrente(lancar.id, conta)); setLancar(null); }}>
                Lançar despesa
              </Button>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
