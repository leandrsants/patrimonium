import type { CanalAquisicao, CategoriaFinanceira, Cliente, Conta, Empresa, ProdutoServico } from "@/lib/types";

export type FormOptions = {
  empresas: Empresa[];
  contas: Conta[];
  categorias: CategoriaFinanceira[];
  canais: CanalAquisicao[];
  produtos: ProdutoServico[];
  clientes: Pick<Cliente, "id" | "nome">[];
  /** Fontes de renda extra não encerradas (Sonati, Danilo, Jiu-jítsu…). */
  fontesExtras?: { id: string; nome: string }[];
};

export const empresaOptions = (o: FormOptions) => o.empresas.map((e) => ({ value: e.id, label: e.nome }));
export const contaOptions = (o: FormOptions) => o.contas.map((c) => ({ value: c.id, label: c.nome }));
export const clienteOptions = (o: FormOptions) => o.clientes.map((c) => ({ value: c.id, label: c.nome }));
export const canalOptions = (o: FormOptions) => o.canais.map((c) => ({ value: c.id, label: c.nome }));

export function categoriaOptions(o: FormOptions, grupos: CategoriaFinanceira["grupo"][]) {
  return o.categorias.filter((c) => grupos.includes(c.grupo) && c.ativo).map((c) => ({ value: c.id, label: c.nome }));
}

export function produtoOptions(o: FormOptions, empresaId: string) {
  return o.produtos
    .filter((p) => p.empresa_id === empresaId && p.ativo)
    .map((p) => ({ value: p.id, label: p.nome }));
}

export const hoje = () => new Date().toISOString().slice(0, 10);
