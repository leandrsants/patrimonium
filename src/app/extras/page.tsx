export const dynamic = "force-dynamic";

import Link from "next/link";
import { PageHeader } from "@/components/shell/PageHeader";
import { Metric, Panel, PanelHeader } from "@/components/ui/primitives";
import { NovaReceitaButton, NovaFonteExtraButton } from "@/components/actions/QuickButtons";
import { SplitBar } from "@/components/charts/BarChart";
import { ExtrasBoard } from "@/components/extras/ExtrasBoard";
import { ExtrasHistorico } from "@/components/extras/ExtrasHistorico";
import { formatBRL } from "@/lib/format";
import { addMeses, diaNoMes, mesRange, resumoPorFonte } from "@/lib/extras";
import { gerarPrevistosExtras } from "@/lib/actions";
import { getLancamentos, getFormOptions, getFontesExtras, getRecorrenciasExtras, getAlunosJiujitsu } from "@/lib/data";

const NOMES_MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function labelMes(competencia: string) {
  const [ano, mes] = competencia.split("-").map(Number);
  return `${NOMES_MES[mes - 1]} de ${ano}`;
}

export default async function ExtrasPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const hojeISO = new Date().toISOString().slice(0, 10);
  const mesAtual = hojeISO.slice(0, 7);
  const mesParam = typeof sp.mes === "string" && /^\d{4}-\d{2}$/.test(sp.mes) ? sp.mes : mesAtual;

  // Previstos do mês atual e do próximo (e do mês visto, se for até 2 à frente).
  // Idempotente no banco: recarregar a página nunca duplica lançamento.
  const gerar = new Set([mesAtual, addMeses(mesAtual, 1)]);
  if (mesParam > mesAtual && mesParam <= addMeses(mesAtual, 2)) gerar.add(mesParam);
  await Promise.all([...gerar].map((m) => gerarPrevistosExtras(`${m}-01`)));

  const [lancamentos, options, fontes, recorrencias, alunos] = await Promise.all([
    getLancamentos(), getFormOptions(), getFontesExtras(), getRecorrenciasExtras(), getAlunosJiujitsu(),
  ]);

  const range = mesRange(mesParam);
  const extras = lancamentos.filter((l) => l.natureza === "receita_extra");
  const contas = options.contas.map((c) => ({ value: c.id, label: c.nome }));

  // Fontes visíveis: não encerradas, ou encerradas com movimento no mês.
  const todosResumos = resumoPorFonte(extras, fontes, range, hojeISO);
  const resumos = todosResumos.filter((r) => fontes.find((f) => f.id === r.fonte.id)?.status !== "encerrada" || r.itens.length > 0);
  const visiveis = fontes.filter((f) => resumos.some((r) => r.fonte.id === f.id));

  const recebido = resumos.reduce((s, r) => s + r.recebido, 0);
  const aVencer = resumos.reduce((s, r) => s + r.previsto, 0);
  const atrasado = resumos.reduce((s, r) => s + r.atrasado, 0);
  const totalMes = recebido + aVencer + atrasado;

  // Previsão do Jiu-jítsu: alunos ativos no dia do repasse do mês visto.
  const [ano, mes] = mesParam.split("-").map(Number);
  const recVariavel = recorrencias.find((r) => r.ativa && fontes.find((f) => f.id === r.fonte_id)?.tipo === "variavel");
  const dataRepasseRef = recVariavel ? diaNoMes(ano, mes, recVariavel.dia_mes) : mesParam === mesAtual ? hojeISO : range.from;

  const composicao = resumos.filter((r) => r.recebido > 0).map((r) => ({ label: r.fonte.nome, value: r.recebido, color: r.fonte.cor }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Receitas extras"
        title="Extras"
        subtitle="Sonati, Danilo, Jiu-jítsu e outras fontes de renda"
        accent="neutral"
        actions={
          <div className="flex gap-2">
            <NovaReceitaButton options={options} extra label="Receita avulsa" />
            <NovaFonteExtraButton options={options} />
          </div>
        }
      />

      <div className="flex items-center gap-3">
        <Link href={`/extras?mes=${addMeses(mesParam, -1)}`} aria-label="Mês anterior" className="rounded-lg2 border border-line px-2.5 py-1 text-sm text-ink-faint hover:bg-surface-hover hover:text-ink">‹</Link>
        <span className="min-w-[160px] text-center text-sm font-medium capitalize text-ink">{labelMes(mesParam)}</span>
        <Link href={`/extras?mes=${addMeses(mesParam, 1)}`} aria-label="Próximo mês" className="rounded-lg2 border border-line px-2.5 py-1 text-sm text-ink-faint hover:bg-surface-hover hover:text-ink">›</Link>
        {mesParam !== mesAtual ? <Link href="/extras" className="text-2xs text-ink-faint hover:text-ink-soft">voltar ao mês atual</Link> : null}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric label="Recebido no mês" value={formatBRL(recebido)} accent="positive" size="lg" />
        <Metric label="Previsto (a vencer)" value={formatBRL(aVencer)} accent="warning" />
        <Metric label="Atrasado" value={formatBRL(atrasado)} accent={atrasado > 0 ? "negative" : "neutral"} />
        <Metric label="Total do mês" value={formatBRL(totalMes)} hint={`Falta entrar ${formatBRL(aVencer + atrasado)}`} />
      </div>

      <ExtrasBoard resumos={resumos} fontes={visiveis.length > 0 ? visiveis : fontes} recorrencias={recorrencias} alunos={alunos} contas={contas} dataRepasseRef={dataRepasseRef} />

      {composicao.length > 0 ? (
        <Panel>
          <PanelHeader title="Recebido por fonte" description={labelMes(mesParam)} />
          <SplitBar parts={composicao} />
        </Panel>
      ) : null}

      <Panel className="border-extra/20 bg-extra/[0.02]">
        <p className="text-sm text-ink-faint">
          Recebimentos das fontes extras entram no <span className="text-ink">caixa, no patrimônio, no faturamento total e na Meta 10K</span>.
          Nunca entram no CAC, ticket ou lucro da Vision/Digital Smile. Extras avulsos sem fonte (ex.: presentes) não contam na meta.
        </p>
      </Panel>

      <Panel>
        <PanelHeader title="Histórico de receitas extras" />
        <ExtrasHistorico lancamentos={extras} fontes={fontes.map((f) => ({ id: f.id, nome: f.nome, cor: f.cor }))} />
      </Panel>
    </div>
  );
}
