/**
 * venda.ts — o que acontece quando um pedido é confirmado como pago.
 *
 * Centraliza o "reportar a venda" (Meta Conversions API + MecProAI) para
 * que o webhook do Asaas e a confirmação manual no admin usem o mesmo
 * caminho, e para garantir que cada venda seja reportada UMA vez só
 * (o Asaas manda PAYMENT_CONFIRMED e depois PAYMENT_RECEIVED pro mesmo
 * pagamento de cartão, por exemplo).
 */

import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { pedidos, itensPedido } from "../../shared/schema";
import { ENV } from "../_core/env";
import { enviarCompraMeta } from "./meta-capi";
import { reportarVendaMecproai } from "./mecproai";

export async function reportarVendaPaga(pedidoId: number): Promise<void> {
  // Trava atômica: só quem conseguir virar vendaReportada false→true reporta
  const [pedido] = await db
    .update(pedidos)
    .set({ vendaReportada: true })
    .where(and(eq(pedidos.id, pedidoId), eq(pedidos.vendaReportada, false)))
    .returning();

  if (!pedido) return; // já reportado antes

  const itens = await db.query.itensPedido.findMany({
    where: eq(itensPedido.pedidoId, pedido.id),
    with: { produto: true },
  });

  const total = Number(pedido.total);
  const a = pedido.atribuicao ?? {};
  const end = pedido.enderecoEntrega;

  await Promise.allSettled([
    enviarCompraMeta({
      eventId: pedido.codigoPedido,
      valor: total,
      email: pedido.clienteEmail,
      telefone: pedido.clienteTelefone,
      nome: pedido.clienteNome,
      cidade: end?.cidade,
      uf: end?.uf,
      cep: end?.cep,
      fbp: a.fbp,
      fbc: a.fbc,
      ip: a.ip,
      userAgent: a.userAgent,
      urlOrigem: `${ENV.siteUrl}/checkout`,
      produtos: itens.map((i) => ({
        id: i.produtoId,
        quantidade: i.quantidade,
        preco: Number(i.precoUnitario),
      })),
    }),
    reportarVendaMecproai({
      codigoPedido: pedido.codigoPedido,
      status: "paid",
      totalCentavos: Math.round(total * 100),
      email: pedido.clienteEmail,
      produtoPrincipal: itens[0]
        ? { id: itens[0].produtoId, nome: itens[0].produto.nome }
        : { id: 0, nome: "Pedido" },
      utm: a,
    }),
  ]);
}
