import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ──────────────────────────────────────────────────────────
// ENUMS
// ──────────────────────────────────────────────────────────

export const categoriaEnum = pgEnum("categoria", [
  "aneis",
  "brincos",
  "colares",
  "pulseiras",
  "aliancas",
  "conjuntos",
]);

export const statusArteEnum = pgEnum("status_arte", [
  "nao_aplicavel", // produto não personalizável
  "aguardando_upload",
  "em_analise",
  "aprovada",
  "reprovada",
]);

export const statusPedidoEnum = pgEnum("status_pedido", [
  "aguardando_pagamento",
  "pago",
  "em_producao",
  "pronto_envio",
  "enviado",
  "entregue",
  "cancelado",
]);

export const gatewayEnum = pgEnum("gateway_pagamento", ["asaas", "stripe"]);

export const metodoPagamentoEnum = pgEnum("metodo_pagamento", [
  "pix",
  "boleto",
  "cartao_credito",
]);

export const tipoPersonalizacaoEnum = pgEnum("tipo_personalizacao", [
  "gravacao", // nomes, data, iniciais (alianças, plaquinhas, pingentes)
]);

// ──────────────────────────────────────────────────────────
// PRODUTOS
// ──────────────────────────────────────────────────────────

export const produtos = pgTable("produtos", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  categoria: categoriaEnum("categoria").notNull(),
  descricao: text("descricao"),

  precoBase: numeric("preco_base", { precision: 10, scale: 2 }).notNull(),
  // Preço "de/por" — quando preenchido e menor que precoBase, a vitrine
  // mostra o base riscado e cobra o promocional (checkout recalcula no server)
  precoPromocional: numeric("preco_promocional", { precision: 10, scale: 2 }),

  // Ficha técnica da peça
  material: varchar("material", { length: 120 }), // ex: "Latão com banho de ouro 18k"
  pedras: varchar("pedras", { length: 160 }), // ex: "Zircônias brancas"
  dimensoes: varchar("dimensoes", { length: 120 }), // ex: "Pingente 1,2 cm · corrente 45 cm"
  garantiaMeses: integer("garantia_meses").notNull().default(12),
  hipoalergenica: boolean("hipoalergenica").notNull().default(true),

  // Vitrine
  destaque: boolean("destaque").notNull().default(false),
  novidade: boolean("novidade").notNull().default(false),

  // Personalização (gravação de nomes/data)
  personalizavel: boolean("personalizavel").notNull().default(false),
  tipoPersonalizacao: tipoPersonalizacaoEnum("tipo_personalizacao"),
  custoPersonalizacao: numeric("custo_personalizacao", {
    precision: 10,
    scale: 2,
  }).default("0"),

  // Quando true, esconde precoBase na vitrine e mostra "Sob consulta"
  // (comum em alianças de ouro maciço, que dependem do peso/aro)
  precoSobConsulta: boolean("preco_sob_consulta").notNull().default(false),

  // Estoque — só é levado em conta quando controlarEstoque=true. Peças
  // sob encomenda (alianças sob medida) ficam de fora do controle.
  controlarEstoque: boolean("controlar_estoque").notNull().default(false),
  estoque: integer("estoque").notNull().default(0),

  // Conjunto montado a partir de outras peças do catálogo
  ehKit: boolean("eh_kit").notNull().default(false),

  // Prazo de preparo antes do envio (pronta entrega = 1-2 dias,
  // alianças sob medida/gravadas = mais)
  prazoProducaoDias: integer("prazo_producao_dias").notNull().default(2),
  cuidados: text("cuidados").default(
    "Evite contato com perfume, cremes, cloro e água do mar. Guarde a peça separada, no saquinho ou estojo, e limpe com flanela seca."
  ),

  imagens: jsonb("imagens").$type<string[]>().default([]),
  ativo: boolean("ativo").notNull().default(true),

  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em").defaultNow().notNull(),
});

// Banho/acabamento de uma peça (ex: Ouro 18k, Ródio branco, Ouro rosé)
export const variantesBanho = pgTable("variantes_banho", {
  id: serial("id").primaryKey(),
  produtoId: integer("produto_id")
    .notNull()
    .references(() => produtos.id, { onDelete: "cascade" }),
  nome: varchar("nome", { length: 80 }).notNull(), // ex: "Ouro 18k"
  codigoHex: varchar("codigo_hex", { length: 7 }), // ex: "#D4AF37"
  codigoFornecedor: varchar("codigo_fornecedor", { length: 40 }), // referência interna/fornecedor
  imagemUrl: text("imagem_url"),
  estoqueDisponivel: boolean("estoque_disponivel").notNull().default(true),
});

// Tamanho/aro de uma peça (ex: aro 12, 14, 16 · corrente 40 cm, 45 cm)
export const variantesTamanho = pgTable("variantes_tamanho", {
  id: serial("id").primaryKey(),
  produtoId: integer("produto_id")
    .notNull()
    .references(() => produtos.id, { onDelete: "cascade" }),
  nome: varchar("nome", { length: 80 }).notNull(), // ex: "Aro 16"
  codigoHex: varchar("codigo_hex", { length: 7 }), // não usado em tamanho, mantido por compatibilidade
  imagemUrl: text("imagem_url"),
  estoqueDisponivel: boolean("estoque_disponivel").notNull().default(true),
});

// Itens que compõem um kit (auto-relação produto -> produto)
export const itensKit = pgTable("itens_kit", {
  id: serial("id").primaryKey(),
  kitId: integer("kit_id")
    .notNull()
    .references(() => produtos.id, { onDelete: "cascade" }),
  produtoId: integer("produto_id")
    .notNull()
    .references(() => produtos.id, { onDelete: "cascade" }),
  quantidade: integer("quantidade").notNull().default(1),
});

export const produtosRelations = relations(produtos, ({ many }) => ({
  variantesBanho: many(variantesBanho),
  variantesTamanho: many(variantesTamanho),
  itensDoKit: many(itensKit, { relationName: "kit" }),
}));

export const variantesBanhoRelations = relations(variantesBanho, ({ one }) => ({
  produto: one(produtos, {
    fields: [variantesBanho.produtoId],
    references: [produtos.id],
  }),
}));

export const variantesTamanhoRelations = relations(variantesTamanho, ({ one }) => ({
  produto: one(produtos, {
    fields: [variantesTamanho.produtoId],
    references: [produtos.id],
  }),
}));

export const itensKitRelations = relations(itensKit, ({ one }) => ({
  kit: one(produtos, {
    fields: [itensKit.kitId],
    references: [produtos.id],
    relationName: "kit",
  }),
  produto: one(produtos, {
    fields: [itensKit.produtoId],
    references: [produtos.id],
  }),
}));

// ──────────────────────────────────────────────────────────
// PEDIDOS
// ──────────────────────────────────────────────────────────

export const pedidos = pgTable("pedidos", {
  id: serial("id").primaryKey(),
  codigoPedido: varchar("codigo_pedido", { length: 20 }).notNull().unique(), // ex: FS-2026-0042

  clienteNome: varchar("cliente_nome", { length: 160 }).notNull(),
  clienteEmail: varchar("cliente_email", { length: 160 }).notNull(),
  clienteTelefone: varchar("cliente_telefone", { length: 30 }),
  clienteDocumento: varchar("cliente_documento", { length: 20 }), // CPF/CNPJ (Asaas exige)

  enderecoEntrega: jsonb("endereco_entrega").$type<{
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
    pais: string; // "BR" ou outro, para decidir Asaas x Stripe
  }>(),

  status: statusPedidoEnum("status").notNull().default("aguardando_pagamento"),

  gateway: gatewayEnum("gateway").notNull(), // asaas (padrão) | stripe (fase 2)
  metodoPagamento: metodoPagamentoEnum("metodo_pagamento"),
  gatewayReferenciaId: varchar("gateway_referencia_id", { length: 120 }), // id da cobrança no provedor

  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  custoPersonalizacaoTotal: numeric("custo_personalizacao_total", {
    precision: 10,
    scale: 2,
  }).default("0"),
  frete: numeric("frete", { precision: 10, scale: 2 }).default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),

  prazoProducaoEstimado: timestamp("prazo_producao_estimado"),

  // Rastreio — preenchido pelo admin quando o pedido é despachado
  transportadora: varchar("transportadora", { length: 60 }),
  codigoRastreio: varchar("codigo_rastreio", { length: 60 }),

  // Desconto aplicado no Pix (recalculado no server)
  desconto: numeric("desconto", { precision: 10, scale: 2 }).default("0"),

  // Atribuição de marketing — capturada na primeira visita (UTMs e IDs
  // de clique) e gravada no pedido. É o que permite ao MecProAI e ao
  // Meta (Conversions API) saber qual anúncio gerou cada venda.
  atribuicao: jsonb("atribuicao").$type<{
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
    fbclid?: string;
    gclid?: string;
    fbp?: string;
    fbc?: string;
    landingPage?: string;
    referrer?: string;
    userAgent?: string;
    ip?: string;
  }>(),

  // true depois que a venda foi reportada (Meta CAPI + webhook MecProAI) —
  // o Asaas pode mandar o mesmo evento de pagamento mais de uma vez
  vendaReportada: boolean("venda_reportada").notNull().default(false),

  // true depois que o lembrete de "checkout abandonado" foi mandado —
  // evita mandar o mesmo lembrete mais de uma vez pro mesmo pedido
  lembreteAbandonoEnviado: boolean("lembrete_abandono_enviado").notNull().default(false),

  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em").defaultNow().notNull(),
});

export const itensPedido = pgTable("itens_pedido", {
  id: serial("id").primaryKey(),
  pedidoId: integer("pedido_id")
    .notNull()
    .references(() => pedidos.id, { onDelete: "cascade" }),
  produtoId: integer("produto_id")
    .notNull()
    .references(() => produtos.id),
  varianteBanhoId: integer("variante_banho_id").references(() => variantesBanho.id),
  varianteTamanhoId: integer("variante_tamanho_id").references(() => variantesTamanho.id),

  quantidade: integer("quantidade").notNull().default(1),
  precoUnitario: numeric("preco_unitario", { precision: 10, scale: 2 }).notNull(),

  // Personalização deste item específico (texto da gravação)
  personalizado: boolean("personalizado").notNull().default(false),
  arteGravacaoUrl: text("arte_gravacao_url"),
  statusArte: statusArteEnum("status_arte").notNull().default("nao_aplicavel"),
  textoGravacao: varchar("texto_gravacao", { length: 60 }),
  observacoesCliente: text("observacoes_cliente"),
});

export const pedidosRelations = relations(pedidos, ({ many }) => ({
  itens: many(itensPedido),
  eventos: many(pedidoEventos),
}));

export const itensPedidoRelations = relations(itensPedido, ({ one }) => ({
  pedido: one(pedidos, {
    fields: [itensPedido.pedidoId],
    references: [pedidos.id],
  }),
  produto: one(produtos, {
    fields: [itensPedido.produtoId],
    references: [produtos.id],
  }),
  varianteBanho: one(variantesBanho, {
    fields: [itensPedido.varianteBanhoId],
    references: [variantesBanho.id],
  }),
  varianteTamanho: one(variantesTamanho, {
    fields: [itensPedido.varianteTamanhoId],
    references: [variantesTamanho.id],
  }),
}));

// Linha do tempo de um pedido — um evento por mudança de status,
// usado tanto pela página pública de rastreio quanto pelo admin.
export const pedidoEventos = pgTable("pedido_eventos", {
  id: serial("id").primaryKey(),
  pedidoId: integer("pedido_id")
    .notNull()
    .references(() => pedidos.id, { onDelete: "cascade" }),
  status: statusPedidoEnum("status").notNull(),
  descricao: text("descricao"),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

export const pedidoEventosRelations = relations(pedidoEventos, ({ one }) => ({
  pedido: one(pedidos, {
    fields: [pedidoEventos.pedidoId],
    references: [pedidos.id],
  }),
}));

// ──────────────────────────────────────────────────────────
// LEADS (cadastro pra newsletter/promoções)
// ──────────────────────────────────────────────────────────

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 160 }).notNull().unique(),
  nome: varchar("nome", { length: 160 }),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  ativo: boolean("ativo").notNull().default(true),
});

// ──────────────────────────────────────────────────────────
// MENSAGENS RECEBIDAS (e-mail de contato via Resend)
// ──────────────────────────────────────────────────────────

export const mensagensContato = pgTable("mensagens_contato", {
  id: serial("id").primaryKey(),
  resendEmailId: varchar("resend_email_id", { length: 200 }).unique(),
  remetente: varchar("remetente", { length: 200 }).notNull(),
  destinatario: varchar("destinatario", { length: 200 }),
  assunto: varchar("assunto", { length: 250 }),
  corpoTexto: text("corpo_texto"),
  corpoHtml: text("corpo_html"),
  // Metadados dos anexos — [{id, filename, size, contentType}]. O link de
  // download do Resend expira, então guardamos só os metadados aqui e
  // buscamos um link fresco na hora que o admin quiser baixar.
  anexos: jsonb("anexos").$type<
    { id: string; filename: string; size: number; contentType: string }[]
  >(),
  lida: boolean("lida").notNull().default(false),
  respondida: boolean("respondida").notNull().default(false),
  arquivada: boolean("arquivada").notNull().default(false),
  // Lixeira — diferente de "arquivada" (arquivar é "guardar fora da
  // caixa de entrada", excluir é "descartar"). Nada é apagado de
  // verdade do banco, só marcado, então dá pra restaurar.
  excluida: boolean("excluida").notNull().default(false),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

// E-mails que o admin mandou pela aba /admin/emails — sem isso, uma
// resposta enviada simplesmente "sumia": saía de verdade pelo Resend,
// mas não ficava nenhum registro em lugar nenhum pra rever depois.
export const mensagensEnviadas = pgTable("mensagens_enviadas", {
  id: serial("id").primaryKey(),
  // Se a resposta foi a uma mensagem recebida, guarda a referência —
  // fica nulo pra e-mails avulsos (não é obrigatório responder algo).
  mensagemOrigemId: integer("mensagem_origem_id").references(() => mensagensContato.id, {
    onDelete: "set null",
  }),
  destinatario: varchar("destinatario", { length: 200 }).notNull(),
  assunto: varchar("assunto", { length: 250 }),
  corpo: text("corpo").notNull(),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

// ──────────────────────────────────────────────────────────
// BANNERS DE CATEGORIA (foto de fundo dos tiles "Pronta Entrega",
// "Personalizados", "Casa" na Home) — editável pelo admin
// ──────────────────────────────────────────────────────────

export const categoriaBanners = pgTable("categoria_banners", {
  categoria: varchar("categoria", { length: 40 }).primaryKey(),
  imagemUrl: text("imagem_url"),
  atualizadoEm: timestamp("atualizado_em").defaultNow().notNull(),
});
