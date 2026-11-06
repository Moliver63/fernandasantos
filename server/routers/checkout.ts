/**
 * checkout.ts — Router tRPC de checkout/pedidos
 * Localização: server/routers/checkout.ts
 *
 * No frontend, a chamada fica:
 *   trpc.checkout.criarPedido.useMutation()
 *
 * O webhook do Asaas (chamada externa, não vem do nosso client) continua
 * como rota REST simples em server/routes/asaas-webhook.ts.
 */

import { TRPCError } from "@trpc/server";
import { eq, sql, inArray, and, gte } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { pedidos, itensPedido, pedidoEventos, produtos } from "../../shared/schema";
import { buscarOuCriarCliente, criarCobranca, buscarQrCodePix } from "../lib/asaas";
import { enviarEmail, emailPedidoRecebido } from "../lib/email";
import { calcularPorCep } from "./frete";
import { MARCA } from "../../shared/marca";
import { DESCONTO_PIX, precoEfetivo } from "../../shared/const";
import { publicProcedure, router } from "../_core/trpc";

const enderecoSchema = z.object({
  cep: z.string(),
  logradouro: z.string(),
  numero: z.string(),
  complemento: z.string().optional(),
  bairro: z.string(),
  cidade: z.string(),
  uf: z.string(),
  pais: z.string(),
});

const itemPedidoSchema = z.object({
  produtoId: z.number().int(),
  varianteBanhoId: z.number().int().nullable(),
  varianteTamanhoId: z.number().int().nullable().optional(),
  quantidade: z.number().int().positive().max(20),
  // Ignorado pelo server (o preço é sempre recalculado do banco). Mantido
  // opcional só para compatibilidade com clients antigos em cache.
  precoUnitario: z.number().optional(),
  personalizado: z.boolean(),
  arteGravacaoUrl: z.string().optional(),
  textoGravacao: z.string().optional(),
  observacoesCliente: z.string().optional(),
});

const criarPedidoInput = z.object({
  cliente: z.object({
    nome: z.string().min(1),
    email: z.string().email(),
    telefone: z.string(),
    documento: z.string(),
  }),
  enderecoEntrega: enderecoSchema,
  itens: z.array(itemPedidoSchema).min(1),
  metodoPagamento: z.enum(["PIX", "BOLETO", "CREDIT_CARD"]),
  atribuicao: z
    .object({
      utmSource: z.string().max(200).optional(),
      utmMedium: z.string().max(200).optional(),
      utmCampaign: z.string().max(200).optional(),
      utmContent: z.string().max(200).optional(),
      utmTerm: z.string().max(200).optional(),
      fbclid: z.string().max(500).optional(),
      gclid: z.string().max(500).optional(),
      fbp: z.string().max(200).optional(),
      fbc: z.string().max(500).optional(),
      landingPage: z.string().max(500).optional(),
      referrer: z.string().max(500).optional(),
    })
    .optional(),
});

function gerarCodigoPedido() {
  const ano = new Date().getFullYear();
  const aleatorio = Math.floor(1000 + Math.random() * 9000);
  return `${MARCA.prefixoPedido}-${ano}-${aleatorio}`;
}

export const checkoutRouter = router({
  criarPedido: publicProcedure
    .input(criarPedidoInput)
    .mutation(async ({ input, ctx }) => {
      // Regra de roteamento de gateway: Brasil -> Asaas. Fora do Brasil -> bloqueado
      // por enquanto (Stripe é fase 2 — decisão do Conselho).
      if (input.enderecoEntrega.pais !== "BR") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Envios internacionais ainda não estão disponíveis. Em breve via Stripe.",
        });
      }

      // ── Preço SEMPRE recalculado a partir do banco. O valor que vem do
      // navegador nunca é confiável (bastaria editar a requisição para
      // comprar uma aliança por R$ 1). ──
      const idsProdutos = [...new Set(input.itens.map((i) => i.produtoId))];
      const produtosDoCarrinho = await db.query.produtos.findMany({
        where: inArray(produtos.id, idsProdutos),
      });

      const itensPrecificados = input.itens.map((item) => {
        const produto = produtosDoCarrinho.find((p) => p.id === item.produtoId);
        if (!produto || !produto.ativo) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Uma das peças do carrinho não está mais disponível. Atualize o carrinho.",
          });
        }
        if (produto.precoSobConsulta) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `"${produto.nome}" tem preço sob consulta. Fale com a gente pelo atendimento.`,
          });
        }
        const personalizado = item.personalizado && produto.personalizavel;
        const precoUnitario =
          precoEfetivo(produto) + (personalizado ? Number(produto.custoPersonalizacao ?? 0) : 0);
        return { ...item, personalizado, precoUnitario, produto };
      });

      const subtotal = itensPrecificados.reduce(
        (soma, item) => soma + item.precoUnitario * item.quantidade,
        0
      );
      const custoPersonalizacaoTotal = itensPrecificados.reduce(
        (soma, item) =>
          soma + (item.personalizado ? Number(item.produto.custoPersonalizacao ?? 0) * item.quantidade : 0),
        0
      );

      // ── Checagem de estoque — só produtos com controlarEstoque=true ──
      for (const item of itensPrecificados) {
        const produto = item.produto;
        if (produto.controlarEstoque && produto.estoque < item.quantidade) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Só temos ${produto.estoque} unidade(s) de "${produto.nome}" em estoque no momento.`,
          });
        }
      }

      const freteCalculado = calcularPorCep(input.enderecoEntrega.cep);
      const valorFrete = freteCalculado?.valor ?? 0;
      const desconto = input.metodoPagamento === "PIX" ? subtotal * DESCONTO_PIX : 0;
      const total = Math.round((subtotal - desconto + valorFrete) * 100) / 100;

      const codigoPedido = gerarCodigoPedido();

      const [pedido] = await db
        .insert(pedidos)
        .values({
          codigoPedido,
          clienteNome: input.cliente.nome,
          clienteEmail: input.cliente.email,
          clienteTelefone: input.cliente.telefone,
          clienteDocumento: input.cliente.documento,
          enderecoEntrega: input.enderecoEntrega,
          status: "aguardando_pagamento",
          gateway: "asaas",
          metodoPagamento:
            input.metodoPagamento === "PIX"
              ? "pix"
              : input.metodoPagamento === "BOLETO"
              ? "boleto"
              : "cartao_credito",
          subtotal: subtotal.toFixed(2),
          custoPersonalizacaoTotal: custoPersonalizacaoTotal.toFixed(2),
          frete: valorFrete.toFixed(2),
          desconto: desconto.toFixed(2),
          total: total.toFixed(2),
          atribuicao: {
            ...(input.atribuicao ?? {}),
            ip: ctx.req.ip,
            userAgent: ctx.req.header("user-agent")?.slice(0, 400),
          },
        })
        .returning();

      await db.insert(itensPedido).values(
        itensPrecificados.map((item) => ({
          pedidoId: pedido.id,
          produtoId: item.produtoId,
          varianteBanhoId: item.varianteBanhoId,
          varianteTamanhoId: item.varianteTamanhoId ?? null,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario.toFixed(2),
          personalizado: item.personalizado,
          arteGravacaoUrl: item.arteGravacaoUrl,
          textoGravacao: item.textoGravacao,
          observacoesCliente: item.observacoesCliente,
          statusArte: item.personalizado
            ? ("em_analise" as const)
            : ("nao_aplicavel" as const),
        }))
      );

      // Decremento atômico — o WHERE com estoque >= quantidade evita
      // ficar negativo mesmo em pedidos concorrentes na mesma peça.
      for (const item of itensPrecificados) {
        await db
          .update(produtos)
          .set({ estoque: sql`${produtos.estoque} - ${item.quantidade}` })
          .where(
            and(
              eq(produtos.id, item.produtoId),
              eq(produtos.controlarEstoque, true),
              gte(produtos.estoque, item.quantidade)
            )
          );
      }

      await db.insert(pedidoEventos).values({
        pedidoId: pedido.id,
        status: "aguardando_pagamento",
        descricao: "Pedido recebido, aguardando confirmação de pagamento.",
      });

      // Prazo de produção — usa o maior prazo entre os produtos do carrinho.
      const prazoProducaoDias = Math.max(
        ...produtosDoCarrinho.map((p) => p.prazoProducaoDias),
        1
      );

      await enviarEmail({
        para: input.cliente.email,
        assunto: `Pedido ${codigoPedido} recebido · ${MARCA.nome}`,
        html: emailPedidoRecebido({
          nomeCliente: input.cliente.nome,
          codigoPedido,
          prazoProducaoDias,
        }),
      });

      // Integração Asaas — se falhar, o pedido já foi registrado como
      // "aguardando_pagamento" no banco; o erro é reportado ao cliente
      // sem derrubar o servidor.
      try {
        const clienteAsaas = await buscarOuCriarCliente({
          nome: input.cliente.nome,
          email: input.cliente.email,
          documento: input.cliente.documento,
          telefone: input.cliente.telefone,
        });

        const vencimento = new Date();
        vencimento.setDate(vencimento.getDate() + 3);

        const cobranca = await criarCobranca({
          clienteAsaasId: clienteAsaas.id,
          valor: total,
          descricao: `Pedido ${codigoPedido} · ${MARCA.nome}`,
          metodoPagamento: input.metodoPagamento,
          vencimento: vencimento.toISOString().split("T")[0],
          referenciaExterna: codigoPedido,
        });

        await db
          .update(pedidos)
          .set({ gatewayReferenciaId: cobranca.id })
          .where(eq(pedidos.id, pedido.id));

        let pix: { qrCodePix?: string; copiaECola?: string } = {};
        if (input.metodoPagamento === "PIX") {
          const qr = await buscarQrCodePix(cobranca.id);
          pix = { qrCodePix: qr.encodedImage, copiaECola: qr.payload };
        }

        return {
          sucesso: true as const,
          codigoPedido,
          gateway: "asaas" as const,
          linkPagamento: cobranca.invoiceUrl,
          ...pix,
          frete: valorFrete,
          desconto,
          total,
          itensReportados: itensPrecificados.map((i) => ({
            id: i.produtoId,
            nome: i.produto.nome,
            quantidade: i.quantidade,
            preco: i.precoUnitario,
          })),
          totalCentavos: Math.round(total * 100),
        };
      } catch (erroGateway) {
        console.error(
          `Falha ao processar pagamento Asaas para o pedido ${codigoPedido}:`,
          erroGateway
        );
        // Pedido já está salvo como "aguardando_pagamento" — retorna sucesso
        // parcial em vez de lançar erro, para o client mostrar o código do
        // pedido ao cliente mesmo quando a cobrança falha (mesmo
        // comportamento do endpoint REST original, que respondia 502 com o
        // codigoPedido no corpo).
        return {
          sucesso: false as const,
          codigoPedido,
          total,
          erro:
            "Pedido registrado, mas não foi possível gerar a cobrança agora. " +
            "Nossa equipe entrará em contato para concluir o pagamento.",
        };
      }
    }),
});
