// Constantes compartilhadas entre client e server.

// Fonte única das categorias — ordem, rótulo e descrição usados em
// Header, Home, Catálogo, ProdutoCard, ProdutoDetalhe e no formulário
// admin. Mudar categoria é só mexer aqui (e no enum de shared/schema.ts).
export const CATEGORIAS = [
  {
    valor: "aneis",
    label: "Anéis",
    descricao: "Solitários, aparadores e anéis de presença para todos os dias.",
  },
  {
    valor: "brincos",
    label: "Brincos",
    descricao: "Do ponto de luz delicado à argola que fecha a produção.",
  },
  {
    valor: "colares",
    label: "Colares",
    descricao: "Correntes, gargantilhas e pingentes para compor camadas.",
  },
  {
    valor: "pulseiras",
    label: "Pulseiras",
    descricao: "Riviera, elos e braceletes que acompanham o movimento.",
  },
  {
    valor: "aliancas",
    label: "Alianças",
    descricao: "Namoro, noivado e casamento, com gravação personalizada.",
  },
  {
    valor: "conjuntos",
    label: "Conjuntos",
    descricao: "Peças que já nascem combinando, prontas para presentear.",
  },
] as const;

export const CATEGORIAS_VALIDAS = [
  "aneis",
  "brincos",
  "colares",
  "pulseiras",
  "aliancas",
  "conjuntos",
] as const;

export type Categoria = (typeof CATEGORIAS_VALIDAS)[number];

export function labelCategoria(valor: string): string {
  return CATEGORIAS.find((c) => c.valor === valor)?.label ?? valor;
}

// Sugestões de banho/acabamento — o admin pode digitar outro nome, isso
// é só atalho no formulário de variantes.
export const BANHOS_SUGERIDOS = [
  { nome: "Ouro 18k", codigoHex: "#D4AF37" },
  { nome: "Ouro rosé", codigoHex: "#C99A86" },
  { nome: "Ródio branco", codigoHex: "#D9DCE1" },
  { nome: "Ródio negro", codigoHex: "#3A3D44" },
  { nome: "Prata 925", codigoHex: "#C0C4C8" },
] as const;

export const ROTA_NAO_ENCONTRADA_MSG = "Rota não encontrada.";
export const ERRO_INTERNO_MSG = "Erro interno do servidor.";

// Fonte única dos status de pedido — ordem do fluxo, rótulo e cor do
// badge usados no admin (lista e detalhe de pedidos).
export const STATUS_PEDIDO = [
  { valor: "aguardando_pagamento", label: "Aguardando pagamento", cor: "bg-linha text-tinta" },
  { valor: "pago", label: "Pago", cor: "bg-safira-claro text-safira" },
  { valor: "em_producao", label: "Em preparação", cor: "bg-ouro/20 text-ouro-profundo" },
  { valor: "pronto_envio", label: "Pronto para envio", cor: "bg-ouro/20 text-ouro-profundo" },
  { valor: "enviado", label: "Enviado", cor: "bg-safira-claro text-safira" },
  { valor: "entregue", label: "Entregue", cor: "bg-safira text-marfim" },
  { valor: "cancelado", label: "Cancelado", cor: "bg-red-100 text-red-700" },
] as const;

export function labelStatusPedido(valor: string): string {
  return STATUS_PEDIDO.find((s) => s.valor === valor)?.label ?? valor;
}

export function corStatusPedido(valor: string): string {
  return STATUS_PEDIDO.find((s) => s.valor === valor)?.cor ?? "bg-linha text-tinta";
}

// Preço efetivo de venda: promocional quando existe e é menor que o base.
// Usado no client (vitrine/carrinho) e no server (checkout recalcula
// tudo — nunca confia no preço que vem do navegador).
export function precoEfetivo(p: {
  precoBase: string | number;
  precoPromocional?: string | number | null;
}): number {
  const base = Number(p.precoBase);
  const promo = p.precoPromocional == null ? NaN : Number(p.precoPromocional);
  return Number.isFinite(promo) && promo > 0 && promo < base ? promo : base;
}

export function formatarBRL(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Parcelamento sem juros exibido na vitrine (o Asaas parcela no cartão).
export const PARCELAS_MAX = 6;
export const PARCELA_MINIMA = 50;

export function parcelamento(valor: number): { vezes: number; parcela: number } | null {
  const vezes = Math.min(PARCELAS_MAX, Math.floor(valor / PARCELA_MINIMA));
  if (vezes < 2) return null;
  return { vezes, parcela: valor / vezes };
}

// Desconto no Pix (aplicado de verdade no checkout, server-side)
export const DESCONTO_PIX = 0.05;
