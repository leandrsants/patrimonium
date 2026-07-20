export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/shell/PageHeader";
import { Panel, PanelHeader, MiniMetric, Badge } from "@/components/ui/primitives";
import { ConfigWorkspace } from "@/components/config/ConfigWorkspace";
import { formatBRL, formatDateBR } from "@/lib/format";
import { METODOS } from "@/lib/calc";
import { getEmpresas, getProdutos, getCategorias, getCanais, getContas, getCartoes, getMetaAtiva } from "@/lib/data";

export default async function ConfiguracoesPage() {
  const [empresas, produtos, categorias, canais, contas, cartoes, meta] = await Promise.all([
    getEmpresas(), getProdutos(), getCategorias(), getCanais(), getContas(), getCartoes(), getMetaAtiva(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Configurações" title="Configurações" subtitle="Catálogo, categorias, origens, contas e meta ativa" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniMetric label="Produtos" value={`${produtos.filter((p) => p.ativo).length} ativos`} />
        <MiniMetric label="Categorias" value={String(categorias.length)} />
        <MiniMetric label="Origens" value={String(canais.length)} />
        <MiniMetric label="Contas" value={String(contas.length)} />
      </div>

      <ConfigWorkspace empresas={empresas} produtos={produtos} categorias={categorias} canais={canais} />

      <Panel>
        <PanelHeader title="Métodos de aquisição" description="Dimensão separada do canal — usada para CAC e comparação por método" />
        <div className="flex flex-wrap gap-2">
          {METODOS.map((m) => (
            <Badge key={m.value} accent="neutral">{m.label}</Badge>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Meta ativa" description="Configurada no banco" />
          {meta ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-ink-faint">Nome</span><span className="text-ink-soft">{meta.nome}</span></div>
              <div className="flex justify-between"><span className="text-ink-faint">Valor-alvo</span><span className="tnum text-ink-soft">{formatBRL(meta.valor_alvo)}</span></div>
              <div className="flex justify-between"><span className="text-ink-faint">Período</span><span className="text-ink-soft">{formatDateBR(meta.data_inicio)} — {formatDateBR(meta.data_fim)}</span></div>
              <div className="flex justify-between"><span className="text-ink-faint">Inclui extras</span><span className="text-ink-soft">{meta.inclui_extras ? "Sim" : "Não"}</span></div>
            </div>
          ) : (
            <p className="text-sm text-ink-faint">Nenhuma meta ativa.</p>
          )}
        </Panel>
        <Panel>
          <PanelHeader title="Contas e cartões" description="Gerenciados no Financeiro" />
          <div className="space-y-2 text-sm">
            {contas.map((c) => (
              <div key={c.id} className="flex justify-between"><span className="text-ink-faint">{c.nome}</span><span className="text-2xs text-ink-dim">{c.tipo}</span></div>
            ))}
            {cartoes.map((c) => (
              <div key={c.id} className="flex justify-between"><span className="text-ink-faint">{c.nome}</span><span className="text-2xs text-ink-dim">cartão</span></div>
            ))}
            {contas.length === 0 && cartoes.length === 0 ? <p className="text-ink-dim">Nenhuma conta ou cartão. Cadastre no Financeiro.</p> : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}
