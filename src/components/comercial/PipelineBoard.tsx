"use client";

import { useMemo, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/Tabs";
import { Field, DateInput, TextInput, Select, MoneyInput, parseMoney } from "@/components/ui/fields";
import { ReuniaoForm } from "@/components/forms/SmallForms";
import { VendaForm } from "@/components/forms/VendaForm";
import { useFormSubmit } from "@/components/forms/FormShell";
import { NovoLeadButton } from "@/components/actions/QuickButtons";
import { atualizarEstagioOportunidade, definirProximoFollowup, registrarProposta, registrarConviteReuniao } from "@/lib/actions";
import { ESTAGIO_ACCENT, ESTAGIO_LABEL, MOTIVOS_PERDA } from "@/lib/labels";
import { formatBRL, formatDateBR } from "@/lib/format";
import type { FormOptions } from "@/components/forms/options";
import type { Oportunidade, Reuniao } from "@/lib/types";

const METODO_FILTROS = [
  { value: "", label: "Todos" },
  { value: "prospeccao_ativa", label: "Prospecção" },
  { value: "trafego_pago", label: "Tráfego" },
  { value: "organico", label: "Orgânico" },
  { value: "indicacao", label: "Indicação" },
];

export function PipelineBoard({
  oportunidades,
  reunioesPorOportunidade,
  estagios,
  options,
  empresaId,
  showMetodoFilter = false,
}: {
  oportunidades: Oportunidade[];
  reunioesPorOportunidade: Record<string, Reuniao[]>;
  estagios: string[];
  options: FormOptions;
  empresaId: string;
  showMetodoFilter?: boolean;
}) {
  const [view, setView] = useState("lista");
  const [busca, setBusca] = useState("");
  const [metodoFiltro, setMetodoFiltro] = useState("");
  const [selected, setSelected] = useState<Oportunidade | null>(null);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return oportunidades.filter((o) => {
      if (metodoFiltro && o.metodo_aquisicao !== metodoFiltro) return false;
      if (!q) return true;
      return (o.nome_contato ?? o.cliente?.nome ?? "").toLowerCase().includes(q) || (o.telefone_contato ?? "").includes(q);
    });
  }, [oportunidades, busca, metodoFiltro]);

  const abertas = filtradas.filter((o) => o.estagio !== "fechado" && o.estagio !== "perdido").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl value={view} onChange={setView} options={[{ value: "lista", label: "Lista" }, { value: "pipeline", label: "Pipeline" }]} />
          {showMetodoFilter ? <SegmentedControl value={metodoFiltro} onChange={setMetodoFiltro} options={METODO_FILTROS} /> : null}
          <span className="text-2xs text-ink-dim">{abertas} em aberto · {filtradas.length} no total</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-44">
            <TextInput value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar…" />
          </div>
          <NovoLeadButton options={options} empresaId={empresaId} variant="primary" />
        </div>
      </div>

      {filtradas.length === 0 ? (
        <EmptyState
          title="Nenhum lead cadastrado"
          description="Cadastre apenas leads com interesse real, que precisam de follow-up ou receberam orçamento."
          cta={<NovoLeadButton options={options} empresaId={empresaId} variant="primary" />}
        />
      ) : view === "pipeline" ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {estagios.map((est) => {
            const cards = filtradas.filter((o) => o.estagio === est);
            return (
              <div key={est} className="rounded-xl2 border border-line bg-surface/40 p-2.5">
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-2xs font-medium text-ink-soft">{ESTAGIO_LABEL[est]}</span>
                  <span className="text-2xs text-ink-dim">{cards.length}</span>
                </div>
                <div className="space-y-2">
                  {cards.map((o) => (
                    <button key={o.id} onClick={() => setSelected(o)} className="block w-full rounded-lg2 border border-line bg-surface p-2.5 text-left transition-colors hover:border-line-strong">
                      <p className="truncate text-xs font-medium text-ink">{o.nome_contato ?? o.cliente?.nome ?? "—"}</p>
                      <p className="mt-0.5 truncate text-2xs text-ink-dim">{o.servico?.nome ?? "sem serviço"}</p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl2 border border-line">
          {filtradas.map((o) => (
            <button key={o.id} onClick={() => setSelected(o)} className="flex w-full items-center justify-between gap-4 border-b border-line/70 px-4 py-3 text-left transition-colors last:border-0 hover:bg-white/[0.02]">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{o.nome_contato ?? o.cliente?.nome ?? "—"}</p>
                <p className="truncate text-2xs text-ink-dim">{o.servico?.nome ?? "sem serviço"} · {o.canal?.nome ?? "sem origem"}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {o.proxima_acao_data ? <span className="hidden text-2xs text-ink-faint sm:block">{formatDateBR(o.proxima_acao_data)}</span> : null}
                <Badge accent={ESTAGIO_ACCENT[o.estagio] ?? "neutral"}>{ESTAGIO_LABEL[o.estagio] ?? o.estagio}</Badge>
              </div>
            </button>
          ))}
        </div>
      )}

      <LeadDrawer
        lead={selected}
        onClose={() => setSelected(null)}
        estagios={estagios}
        reunioes={selected ? reunioesPorOportunidade[selected.id] ?? [] : []}
        options={options}
        empresaId={empresaId}
      />
    </div>
  );
}

function LeadDrawer({
  lead,
  onClose,
  estagios,
  reunioes,
  options,
  empresaId,
}: {
  lead: Oportunidade | null;
  onClose: () => void;
  estagios: string[];
  reunioes: Reuniao[];
  options: FormOptions;
  empresaId: string;
}) {
  const { run } = useFormSubmit();
  const [followData, setFollowData] = useState("");
  const [novaReuniao, setNovaReuniao] = useState(false);
  const [converter, setConverter] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [propOpen, setPropOpen] = useState(false);
  const [propValor, setPropValor] = useState("");
  const [propData, setPropData] = useState(new Date().toISOString().slice(0, 10));

  if (!lead) return null;

  return (
    <Drawer open={!!lead} onClose={onClose} title={lead.nome_contato ?? lead.cliente?.nome ?? "Lead"} description={lead.servico?.nome ?? undefined}>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {estagios.map((est) => (
            <button
              key={est}
              onClick={() => run(() => atualizarEstagioOportunidade(lead.id, est, est === "perdido" ? motivo || undefined : undefined))}
              className={`rounded-full px-3 py-1 text-2xs font-medium transition-colors ${
                lead.estagio === est ? "bg-ink text-canvas" : "border border-line text-ink-faint hover:border-line-strong hover:text-ink-soft"
              }`}
            >
              {ESTAGIO_LABEL[est]}
            </button>
          ))}
        </div>

        <div className="space-y-2 rounded-xl2 border border-line bg-surface-input p-4 text-sm">
          <InfoRow label="Telefone" value={lead.telefone_contato ?? lead.cliente?.telefone ?? "—"} />
          <InfoRow label="Origem" value={lead.canal?.nome ?? "—"} />
          {lead.abordagem ? <InfoRow label="Abordagem" value={lead.abordagem} /> : null}
          {lead.cidade ? <InfoRow label="Cidade" value={lead.cidade} /> : null}
          {lead.valor_potencial ? <InfoRow label="Valor potencial" value={formatBRL(lead.valor_potencial)} /> : null}
          <InfoRow label="Próximo follow-up" value={lead.proxima_acao_data ? formatDateBR(lead.proxima_acao_data) : "—"} />
          {lead.proposta_status ? <InfoRow label="Proposta" value={`${lead.proposta_valor ? formatBRL(lead.proposta_valor) : "—"} · ${lead.proposta_status}`} /> : null}
          {lead.motivo_perda ? <InfoRow label="Motivo da perda" value={lead.motivo_perda} /> : null}
          {lead.observacao ? <InfoRow label="Observação" value={lead.observacao} /> : null}
        </div>

        <div>
          <Field label="Motivo (ao marcar como perdido)">
            <Select value={motivo} onChange={setMotivo} options={MOTIVOS_PERDA.map((m) => ({ value: m, label: m }))} placeholder="Selecionar…" />
          </Field>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => run(() => registrarConviteReuniao(lead.id))}>
            {lead.convite_reuniao_em ? "Convite registrado ✓" : "Registrar convite p/ reunião"}
          </Button>
        </div>

        <div>
          <button onClick={() => setPropOpen((v) => !v)} className="text-sm font-medium text-smile hover:text-smile-soft">{propOpen ? "− Registrar proposta comercial" : "+ Registrar proposta comercial"}</button>
          {propOpen ? (
            <div className="mt-3 space-y-3 border-t border-line pt-3">
              <div className="grid grid-cols-2 gap-2">
                <Field label="Valor proposto"><MoneyInput value={propValor} onChange={setPropValor} /></Field>
                <Field label="Data"><DateInput value={propData} onChange={(e) => setPropData(e.target.value)} /></Field>
              </div>
              <Button onClick={async () => { await run(() => registrarProposta({ oportunidade_id: lead.id, proposta_valor: parseMoney(propValor), proposta_data: propData, proposta_status: "enviada" })); setPropOpen(false); }}>Registrar proposta</Button>
            </div>
          ) : null}
        </div>

        <div>
          <Field label="Definir próximo follow-up">
            <div className="flex gap-2">
              <DateInput value={followData} onChange={(e) => setFollowData(e.target.value)} />
              <Button onClick={() => followData && run(() => definirProximoFollowup(lead.id, followData))}>Salvar</Button>
            </div>
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-2xs font-semibold uppercase tracking-wide text-ink-faint">Reuniões</h4>
            <button onClick={() => setNovaReuniao((v) => !v)} className="text-xs text-ink-faint hover:text-ink-soft">{novaReuniao ? "Cancelar" : "+ Reunião"}</button>
          </div>
          {novaReuniao ? <ReuniaoForm oportunidadeId={lead.id} onDone={() => setNovaReuniao(false)} /> : null}
          {reunioes.length === 0 && !novaReuniao ? (
            <p className="text-xs text-ink-dim">Nenhuma reunião registrada.</p>
          ) : (
            <div className="space-y-1.5">
              {reunioes.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg2 border border-line px-3 py-2 text-xs">
                  <span className="text-ink-soft">{formatDateBR(r.data)} {r.horario ? `· ${r.horario.slice(0, 5)}` : ""}</span>
                  <Badge accent={r.status === "realizada" ? "positive" : r.status === "no_show" ? "negative" : "neutral"}>{r.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {lead.venda_id || lead.estagio === "fechado" ? (
          <div className="rounded-xl2 border border-positive/25 bg-positive-dim px-4 py-3 text-xs text-positive">Negócio fechado{lead.venda_id ? " (venda)" : " (contrato)"}.</div>
        ) : (
          <div>
            <button onClick={() => setConverter((v) => !v)} className="text-sm font-medium text-vision hover:text-vision-soft">
              {converter ? "− Cancelar conversão" : "→ Converter em venda / contrato"}
            </button>
            {converter ? (
              <div className="mt-4 border-t border-line pt-4">
                <VendaForm options={options} onDone={onClose} empresaId={empresaId} oportunidade={lead} />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Drawer>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-ink-faint">{label}</span>
      <span className="text-right text-ink-soft">{value}</span>
    </div>
  );
}
