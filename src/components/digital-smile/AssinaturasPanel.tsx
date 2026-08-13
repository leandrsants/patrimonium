"use client";

import { useMemo, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Badge, EmptyState, KeyValue, Metric } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { TextInput } from "@/components/ui/fields";
import { ChecklistToggle } from "@/components/ui/ChecklistToggle";
import { PagamentoForm } from "@/components/forms/SmallForms";
import { NovaAssinaturaButton } from "@/components/actions/QuickButtons";
import { useFormSubmit } from "@/components/forms/FormShell";
import { atualizarAssinatura, gerarCompetenciaAssinatura } from "@/lib/actions";
import { ASSINATURA_ACCENT, ASSINATURA_LABEL, ONBOARDING_STEPS_DS, OPERACAO_STEPS_DS, SITUACAO_ACCENT, SITUACAO_LABEL } from "@/lib/labels";
import { METODO_LABEL, resultadoPrimeiroMes, resultadoAcumulado } from "@/lib/calc";
import { formatBRL, formatDateBR, formatCompetencia } from "@/lib/format";
import type { FormOptions } from "@/components/forms/options";
import type { Assinatura, ParcelaSituacao } from "@/lib/types";

function tempoComoCliente(dataInicio: string): string {
  const dias = Math.max(0, Math.round((Date.now() - new Date(dataInicio + "T00:00:00").getTime()) / 86400000));
  if (dias < 30) return `${dias} dia(s)`;
  const meses = Math.floor(dias / 30);
  return `${meses} mês(es)`;
}

export function AssinaturasPanel({
  assinaturas, parcelasPorAssinatura, custosDiretosPorCliente, options, contaOpts,
}: {
  assinaturas: Assinatura[];
  parcelasPorAssinatura: Record<string, ParcelaSituacao[]>;
  custosDiretosPorCliente: Record<string, number>;
  options: FormOptions;
  contaOpts: { value: string; label: string }[];
}) {
  const [selected, setSelected] = useState<Assinatura | null>(null);
  const [busca, setBusca] = useState("");

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return assinaturas;
    return assinaturas.filter((a) => (a.cliente?.nome ?? "").toLowerCase().includes(q));
  }, [assinaturas, busca]);

  if (assinaturas.length === 0) {
    return (
      <EmptyState
        title="Nenhum cliente da Digital Smile"
        description="Crie uma assinatura de gestão de tráfego. Contrato, onboarding, operação, cobranças mensais e unit economics ficam dentro do cliente."
        cta={<NovaAssinaturaButton options={options} />}
      />
    );
  }

  const recebidoDe = (a: Assinatura) => (parcelasPorAssinatura[a.id] ?? []).reduce((s, p) => s + Number(p.recebido_liquido), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="w-56"><TextInput value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar cliente…" /></div>
        <NovaAssinaturaButton options={options} />
      </div>
      <div className="overflow-x-auto rounded-xl2 border border-line">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-raised text-2xs uppercase tracking-wider text-ink-faint">
              <th className="px-4 py-3 text-left font-semibold">Cliente</th>
              <th className="px-4 py-3 text-left font-semibold">Serviço</th>
              <th className="px-4 py-3 text-right font-semibold">Mensalidade</th>
              <th className="px-4 py-3 text-left font-semibold">Próxima cobrança</th>
              <th className="px-4 py-3 text-left font-semibold">Origem</th>
              <th className="px-4 py-3 text-left font-semibold">Tempo</th>
              <th className="px-4 py-3 text-right font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((a) => (
              <tr key={a.id} onClick={() => setSelected(a)} className="cursor-pointer border-b border-line/70 transition-colors last:border-0 hover:bg-surface-hover">
                <td className="px-4 py-3 font-medium text-ink">{a.cliente?.nome ?? "—"}</td>
                <td className="px-4 py-3 text-ink-faint">{a.produto?.nome ?? "—"}</td>
                <td className="px-4 py-3 text-right tnum text-ink-soft">{formatBRL(a.valor_mensal)}</td>
                <td className="px-4 py-3 text-ink-faint">{formatDateBR(a.proxima_data_cobranca)}</td>
                <td className="px-4 py-3 text-ink-faint">{a.metodo_aquisicao ? METODO_LABEL[a.metodo_aquisicao] : "—"}</td>
                <td className="px-4 py-3 text-ink-faint">{tempoComoCliente(a.data_inicio)}</td>
                <td className="px-4 py-3 text-right"><Badge accent={ASSINATURA_ACCENT[a.status]}>{ASSINATURA_LABEL[a.status]}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ClienteWorkspace
        assinatura={selected}
        onClose={() => setSelected(null)}
        parcelas={selected ? parcelasPorAssinatura[selected.id] ?? [] : []}
        recebido={selected ? recebidoDe(selected) : 0}
        custosDiretos={selected ? custosDiretosPorCliente[selected.cliente_id] ?? 0 : 0}
        contaOpts={contaOpts}
      />
    </div>
  );
}

function ClienteWorkspace({
  assinatura, onClose, parcelas, recebido, custosDiretos, contaOpts,
}: {
  assinatura: Assinatura | null; onClose: () => void; parcelas: ParcelaSituacao[]; recebido: number; custosDiretos: number; contaOpts: { value: string; label: string }[];
}) {
  const { run } = useFormSubmit();
  const [pagarId, setPagarId] = useState<string | null>(null);
  if (!assinatura) return null;
  const a = assinatura;

  const cacAtribuido = a.cac_atribuido ?? 0;
  const primeiraParcela = [...parcelas].sort((x, y) => (x.competencia_referencia ?? "").localeCompare(y.competencia_referencia ?? ""))[0];
  const receita1 = primeiraParcela ? Number(primeiraParcela.recebido_liquido) : 0;
  const custoDireto1 = parcelas.length > 0 ? custosDiretos / parcelas.length : custosDiretos;
  const res1 = resultadoPrimeiroMes(receita1, cacAtribuido, custoDireto1);
  const resAcum = resultadoAcumulado(recebido, cacAtribuido, custosDiretos);

  return (
    <Drawer open={!!assinatura} onClose={onClose} title={a.cliente?.nome ?? "Cliente"} description={a.produto?.nome ?? undefined}>
      <Tabs
        tabs={[
          {
            label: "Visão geral",
            content: (
              <div className="space-y-4">
                <div className="rounded-xl2 border border-line bg-surface-input p-4">
                  <KeyValue label="Serviço" value={a.produto?.nome} />
                  <KeyValue label="Mensalidade" value={<span className="tnum">{formatBRL(a.valor_mensal)}</span>} />
                  <KeyValue label="Preço de referência" value={a.preco_referencia ? formatBRL(a.preco_referencia) : "—"} />
                  <KeyValue label="Desconto" value={a.desconto_valor > 0 ? `${formatBRL(a.desconto_valor)}${a.motivo_desconto ? ` · ${a.motivo_desconto}` : ""}` : "—"} />
                  <KeyValue label="Início" value={formatDateBR(a.data_inicio)} />
                  <KeyValue label="Tempo como cliente" value={tempoComoCliente(a.data_inicio)} />
                  <KeyValue label="Vencimento" value={`dia ${a.dia_vencimento}`} />
                  <KeyValue label="Próxima cobrança" value={formatDateBR(a.proxima_data_cobranca)} />
                  <KeyValue label="Origem / método" value={a.metodo_aquisicao ? METODO_LABEL[a.metodo_aquisicao] : "—"} />
                </div>
                <div className="rounded-xl2 border border-warning/25 bg-warning/[0.04] p-4">
                  <p className="text-2xs font-semibold uppercase tracking-wide text-warning">Verba de mídia do dentista</p>
                  <p className="mt-1 text-sm tnum text-ink">{a.verba_anuncios_dentista_estimada ? formatBRL(a.verba_anuncios_dentista_estimada) : "—"}</p>
                  <p className="mt-1 text-2xs text-ink-dim">Apenas informativo. Nunca é receita, despesa, investimento, CAC ou caixa da Digital Smile.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["ativo", "pausado", "cancelado"].map((s) => (
                    <button key={s} onClick={() => run(() => atualizarAssinatura(a.id, { status: s }))} className={`rounded-full px-3 py-1 text-2xs font-medium transition-colors ${a.status === s ? "bg-ink text-canvas" : "border border-line text-ink-faint hover:text-ink-soft"}`}>
                      {ASSINATURA_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>
            ),
          },
          {
            label: "Contrato",
            content: (
              <div className="space-y-2">
                {[
                  { key: "contrato_necessario", label: "Contrato necessário" },
                  { key: "contrato_enviado", label: "Contrato enviado" },
                  { key: "contrato_assinado", label: "Contrato assinado" },
                ].map((fld) => {
                  const v = (a as unknown as Record<string, boolean>)[fld.key];
                  return (
                    <button key={fld.key} onClick={() => run(() => atualizarAssinatura(a.id, { [fld.key]: !v }))} className="flex w-full items-center gap-3 rounded-lg2 border border-line px-3 py-2 text-left text-sm hover:border-line-strong">
                      <span className={`flex h-4 w-4 items-center justify-center rounded border ${v ? "border-positive bg-positive text-canvas" : "border-line-strong"}`}>{v ? <span className="text-2xs">✓</span> : null}</span>
                      <span className="text-ink-soft">{fld.label}</span>
                    </button>
                  );
                })}
                <div className="rounded-xl2 border border-line bg-surface-input p-4">
                  <KeyValue label="Assinado em" value={a.data_assinatura_contrato ? formatDateBR(a.data_assinatura_contrato) : "—"} />
                  <KeyValue label="Prazo" value={a.prazo_meses ? `${a.prazo_meses} meses` : "cancelamento livre"} />
                  <KeyValue label="Reajuste previsto" value={a.data_reajuste ? formatDateBR(a.data_reajuste) : "—"} />
                  <KeyValue label="Link Drive" value={a.contrato_drive_link ? <a href={a.contrato_drive_link} target="_blank" rel="noreferrer" className="text-smile hover:underline">Abrir</a> : "—"} />
                  {a.data_cancelamento ? <KeyValue label="Cancelado em" value={`${formatDateBR(a.data_cancelamento)}${a.motivo_cancelamento ? ` · ${a.motivo_cancelamento}` : ""}`} /> : null}
                </div>
                <p className="text-2xs text-ink-dim">O arquivo do contrato não é armazenado no app — apenas o link do Drive. Histórico nunca é apagado.</p>
              </div>
            ),
          },
          {
            label: "Onboarding",
            content: <ChecklistToggle steps={ONBOARDING_STEPS_DS} values={a.checklist_onboarding ?? {}} onChange={(next) => atualizarAssinatura(a.id, { checklist_onboarding: next })} />,
          },
          {
            label: "Operação",
            content: <ChecklistToggle steps={OPERACAO_STEPS_DS} values={a.checklist_entrega_trafego ?? {}} onChange={(next) => atualizarAssinatura(a.id, { checklist_entrega_trafego: next })} />,
          },
          {
            label: "Pagamentos",
            content: (
              <div className="space-y-4">
                <Button onClick={() => run(() => gerarCompetenciaAssinatura(a.id))} className="w-full">Gerar cobrança da competência atual</Button>
                <p className="text-2xs text-ink-dim">A próxima cobrança avança quando a competência é criada — não quando é paga. Várias competências podem ficar em aberto.</p>
                <div className="space-y-2">
                  {parcelas.length === 0 ? (
                    <p className="text-sm text-ink-faint">Nenhuma competência gerada ainda.</p>
                  ) : (
                    [...parcelas].sort((x, y) => (x.competencia_referencia ?? "").localeCompare(y.competencia_referencia ?? "")).map((p) => (
                      <div key={p.id} className="rounded-lg2 border border-line px-3 py-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-ink">{formatCompetencia(p.competencia_referencia)}</p>
                            <p className="text-2xs text-ink-dim">Vence {formatDateBR(p.data_vencimento)}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs tnum text-ink-soft">{formatBRL(p.recebido_liquido)} / {formatBRL(p.valor_devido)}</span>
                            <Badge accent={SITUACAO_ACCENT[p.situacao_calculada]}>{SITUACAO_LABEL[p.situacao_calculada]}</Badge>
                          </div>
                        </div>
                        {p.saldo_pendente > 0 ? (
                          pagarId === p.id ? (
                            <div className="mt-3 border-t border-line pt-3"><PagamentoForm parcelaId={p.id} saldoPendente={Number(p.saldo_pendente)} contas={contaOpts} onDone={() => setPagarId(null)} /></div>
                          ) : (
                            <button onClick={() => setPagarId(p.id)} className="mt-2 text-2xs font-medium text-positive hover:underline">+ Registrar pagamento</button>
                          )
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ),
          },
          {
            label: "Métricas",
            content: (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Metric label="LTV realizado" value={formatBRL(recebido)} accent="positive" />
                  <Metric label="CAC atribuído" value={cacAtribuido > 0 ? formatBRL(cacAtribuido) : "não informado"} />
                  <Metric label="Custos diretos" value={formatBRL(custosDiretos)} accent="negative" />
                  <Metric label="Resultado acumulado" value={formatBRL(resAcum)} accent={resAcum >= 0 ? "positive" : "negative"} />
                </div>
                <div className="rounded-xl2 border border-line bg-surface-input p-4">
                  <KeyValue label="Receita 1º mês" value={<span className="tnum">{formatBRL(receita1)}</span>} />
                  <KeyValue label="CAC (uma vez)" value={<span className="tnum">− {formatBRL(cacAtribuido)}</span>} />
                  <KeyValue label="Custos diretos 1º mês" value={<span className="tnum">− {formatBRL(custoDireto1)}</span>} />
                  <div className="mt-1 border-t border-line pt-2">
                    <KeyValue label="Resultado 1º mês" value={<span className={`tnum font-semibold ${res1 >= 0 ? "text-positive" : "text-negative"}`}>{formatBRL(res1)}</span>} />
                  </div>
                </div>
                <p className="text-2xs text-ink-dim">O CAC é descontado uma única vez (não todo mês). Custos diretos = despesas lançadas com este cliente. Sem rateio de overhead. Informe o CAC atribuído na criação para precisão.</p>
              </div>
            ),
          },
        ]}
      />
    </Drawer>
  );
}
