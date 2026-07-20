"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { TextInput } from "@/components/ui/fields";
import { NovoClienteButton } from "@/components/actions/QuickButtons";
import { formatBRL, formatDateBR } from "@/lib/format";

export type ClienteRow = {
  id: string;
  nome: string;
  telefone: string | null;
  produtos: string;
  vendido: number;
  recebido: number;
  pendente: number;
  ultimaVenda: string | null;
  entrega: string | null;
  atrasado: boolean;
};

export function ClientesPanel({ rows }: { rows: ClienteRow[] }) {
  const [busca, setBusca] = useState("");
  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.nome.toLowerCase().includes(q) || (r.telefone ?? "").includes(q));
  }, [rows, busca]);

  if (rows.length === 0) {
    return (
      <EmptyState
        title="Nenhum cliente com relação nesta empresa"
        description="Clientes com vendas ou assinaturas nesta empresa aparecerão aqui. O cliente é global — uma pessoa existe uma única vez."
        cta={<NovoClienteButton variant="primary" />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="w-56">
          <TextInput value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar cliente…" />
        </div>
        <NovoClienteButton variant="primary" />
      </div>

      <div className="overflow-x-auto rounded-xl2 border border-line">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line bg-white/[0.015] text-2xs uppercase tracking-wider text-ink-faint">
              <th className="px-4 py-3 text-left font-semibold">Cliente</th>
              <th className="px-4 py-3 text-left font-semibold">Produtos</th>
              <th className="px-4 py-3 text-right font-semibold">Vendido</th>
              <th className="px-4 py-3 text-right font-semibold">Recebido</th>
              <th className="px-4 py-3 text-right font-semibold">Pendente</th>
              <th className="px-4 py-3 text-right font-semibold">Situação</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((r) => (
              <tr key={r.id} className="border-b border-line/70 transition-colors last:border-0 hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <Link href={`/clientes/${r.id}`} className="block">
                    <span className="block font-medium text-ink hover:text-vision">{r.nome}</span>
                    <span className="block text-2xs text-ink-dim">{r.telefone ?? "sem telefone"}</span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-faint">{r.produtos || "—"}</td>
                <td className="px-4 py-3 text-right tnum text-ink-soft">{formatBRL(r.vendido, { compact: true })}</td>
                <td className="px-4 py-3 text-right tnum text-positive">{formatBRL(r.recebido, { compact: true })}</td>
                <td className="px-4 py-3 text-right tnum text-warning">{formatBRL(r.pendente, { compact: true })}</td>
                <td className="px-4 py-3 text-right">
                  {r.atrasado ? <Badge accent="negative">Atrasado</Badge> : r.pendente > 0 ? <Badge accent="warning">A receber</Badge> : <Badge accent="positive">Em dia</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
