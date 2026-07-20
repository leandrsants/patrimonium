export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shell/PageHeader";
import { Metric, Panel, PanelHeader, Badge, KeyValue, EmptyState } from "@/components/ui/primitives";
import { EditClienteButton } from "@/components/comercial/EditClienteButton";
import { formatBRL, formatDateBR } from "@/lib/format";
import { ENTREGA_LABEL, SITUACAO_ACCENT, SITUACAO_LABEL } from "@/lib/labels";
import { getClienteById, getEmpresas, getVendas, getAssinaturas, getParcelasSituacao } from "@/lib/data";

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cliente = await getClienteById(id);
  if (!cliente) return notFound();

  const [empresas, vendas, assinaturas, parcelas] = await Promise.all([
    getEmpresas(), getVendas(), getAssinaturas(), getParcelasSituacao(),
  ]);
  const empresaNome = (eid: string | null) => empresas.find((e) => e.id === eid)?.nome ?? "—";

  const vendasCliente = vendas.filter((v) => v.cliente_id === id);
  const assinaturasCliente = assinaturas.filter((a) => a.cliente_id === id);

  const parcelasPorVenda: Record<string, typeof parcelas> = {};
  for (const p of parcelas) if (p.venda_id) (parcelasPorVenda[p.venda_id] ??= []).push(p);

  let vendido = 0, recebido = 0, pendente = 0;
  for (const v of vendasCliente) {
    vendido += Number(v.valor_final);
    const ps = parcelasPorVenda[v.id] ?? [];
    recebido += ps.reduce((s, p) => s + Number(p.recebido_liquido), 0);
    pendente += ps.reduce((s, p) => s + Number(p.saldo_pendente), 0);
  }

  const empresasRelacionadas = Array.from(new Set([...vendasCliente.map((v) => v.empresa_id), ...assinaturasCliente.map((a) => a.empresa_id)]));
  const servicos = Array.from(new Set([...vendasCliente.map((v) => v.produto?.nome).filter(Boolean), ...assinaturasCliente.map((a) => a.produto?.nome).filter(Boolean)])) as string[];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-2xs text-ink-faint">
        <Link href="/vision" className="hover:text-ink-soft">Clientes</Link>
        <span>/</span>
        <span className="text-ink-soft">{cliente.nome}</span>
      </div>

      <PageHeader
        eyebrow="Cliente global"
        title={cliente.nome}
        subtitle={cliente.telefone ?? "sem telefone"}
        actions={<EditClienteButton cliente={cliente} />}
      />

      {cliente.tipo_registro === "legado_teste" ? (
        <div className="rounded-xl2 border border-warning/25 bg-warning/[0.04] px-4 py-2.5 text-xs text-warning">
          Registro marcado como legado/teste — fora das métricas reais.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Metric label="Total vendido" value={formatBRL(vendido)} />
        <Metric label="Recebido" value={formatBRL(recebido)} accent="positive" />
        <Metric label="Pendente" value={formatBRL(pendente)} accent={pendente > 0 ? "warning" : "neutral"} />
        <Metric label="Serviços" value={String(servicos.length)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel>
          <PanelHeader title="Dados" />
          <div>
            <KeyValue label="Telefone" value={cliente.telefone ?? "—"} />
            <KeyValue label="E-mail" value={cliente.email ?? "—"} />
            <KeyValue label="CPF / CNPJ" value={cliente.cpf_cnpj ?? "—"} />
            <KeyValue label="Empresa / Clínica" value={cliente.empresa_clinica_nome ?? "—"} />
            <KeyValue label="Instagram" value={cliente.instagram ?? "—"} />
            <KeyValue label="Drive" value={cliente.drive_link ? <a href={cliente.drive_link} className="text-vision hover:underline" target="_blank" rel="noreferrer">Abrir</a> : "—"} />
            {cliente.observacao ? <KeyValue label="Observações" value={cliente.observacao} /> : null}
          </div>
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelHeader title="Relações" description="Empresas e serviços deste cliente" />
          <div className="mb-4 flex flex-wrap gap-2">
            {empresasRelacionadas.length === 0 ? <span className="text-sm text-ink-faint">Nenhuma relação ainda.</span> : null}
            {empresasRelacionadas.map((eid) => (
              <Badge key={eid} accent={empresas.find((e) => e.id === eid)?.slug === "vision" ? "vision" : "smile"}>{empresaNome(eid)}</Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {servicos.map((s) => (
              <span key={s} className="rounded-full border border-line px-3 py-1 text-xs text-ink-soft">{s}</span>
            ))}
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="Histórico de vendas" />
        {vendasCliente.length === 0 ? (
          <EmptyState title="Nenhuma venda" description="As vendas deste cliente aparecerão aqui, com valor, recebido e status de entrega." />
        ) : (
          <div className="overflow-x-auto rounded-xl2 border border-line">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line bg-white/[0.015] text-2xs uppercase tracking-wider text-ink-faint">
                  <th className="px-4 py-3 text-left font-semibold">Data</th>
                  <th className="px-4 py-3 text-left font-semibold">Produto</th>
                  <th className="px-4 py-3 text-left font-semibold">Empresa</th>
                  <th className="px-4 py-3 text-right font-semibold">Valor</th>
                  <th className="px-4 py-3 text-left font-semibold">Entrega</th>
                </tr>
              </thead>
              <tbody>
                {vendasCliente.map((v) => (
                  <tr key={v.id} className="border-b border-line/70 last:border-0">
                    <td className="px-4 py-3 text-ink-faint">{formatDateBR(v.data_venda)}</td>
                    <td className="px-4 py-3 text-ink-soft">{v.produto?.nome}</td>
                    <td className="px-4 py-3 text-ink-faint">{empresaNome(v.empresa_id)}</td>
                    <td className="px-4 py-3 text-right tnum text-ink-soft">{formatBRL(v.valor_final)}</td>
                    <td className="px-4 py-3 text-ink-faint">{v.status_entrega ? ENTREGA_LABEL[v.status_entrega] ?? v.status_entrega : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {assinaturasCliente.length > 0 ? (
        <Panel>
          <PanelHeader title="Assinaturas" />
          <div className="space-y-2">
            {assinaturasCliente.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg2 border border-line px-4 py-3 text-sm">
                <span className="text-ink-soft">{a.produto?.nome} · {empresaNome(a.empresa_id)}</span>
                <span className="tnum text-ink-faint">{formatBRL(a.valor_mensal)}/mês</span>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
