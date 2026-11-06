import { Router } from "express";
import { timingSafeEqual } from "node:crypto";
import { and, eq, ne } from "drizzle-orm";
import { db } from "../db";
import { pedidos, pedidoEventos } from "../../shared/schema";
import { MARCA } from "../../shared/marca";
import { ENV } from "../_core/env";
import { enviarEmail, emailPagamentoConfirmado } from "../lib/email";
import { reportarVendaPaga } from "../lib/venda";
import { reportarVendaMecproai } from "../lib/mecproai";

const asaasWebhookRouter = Router();

function tokenValido(recebido: string | undefined): boolean {
  if (!ENV.asaasWebhookToken) {
    // Sem token configurado aceita (para não travar o sandbox), mas avisa
    // alto — em produção ASAAS_WEBHOOK_TOKEN é obrigatório.
    if (ENV.isProduction) {
      console.warn("[asaas-webhook] ASAAS_WEBHOOK_TOKEN não configurado — webhook sem autenticação!");
    }
    return true;
  }
  if (!recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(ENV.asaasWebhookToken);
  return a.length === b.length && timingSafeEqual(a, b);
}

// POST /api/webhooks/asaas — recebido pelo Asaas em mudanças de status
asaasWebhookRouter.post("/", async (req, res) => {
  if (!tokenValido(req.header("asaas-access-token"))) {
    return res.sendStatus(401);
  }

  try {
    const { event, payment } = req.body ?? {};

    if ((event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") && payment?.id) {
      // Só muda pra "pago" se ainda estava aguardando — evita que o segundo
      // evento (CONFIRMED → RECEIVED) volte um pedido já "enviado" pra "pago"
      const [atualizado] = await db
        .update(pedidos)
        .set({ status: "pago", atualizadoEm: new Date() })
        .where(
          and(
            eq(pedidos.gatewayReferenciaId, payment.id),
            eq(pedidos.status, "aguardando_pagamento")
          )
        )
        .returning();

      if (atualizado) {
        await db.insert(pedidoEventos).values({
          pedidoId: atualizado.id,
          status: "pago",
          descricao: "Pagamento confirmado.",
        });

        await enviarEmail({
          para: atualizado.clienteEmail,
          assunto: `Pagamento confirmado · Pedido ${atualizado.codigoPedido} · ${MARCA.nome}`,
          html: emailPagamentoConfirmado({
            nomeCliente: atualizado.clienteNome,
            codigoPedido: atualizado.codigoPedido,
          }),
        });

        await reportarVendaPaga(atualizado.id);
      }
    }

    if (event === "PAYMENT_REFUNDED" && payment?.id) {
      const [cancelado] = await db
        .update(pedidos)
        .set({ status: "cancelado", atualizadoEm: new Date() })
        .where(and(eq(pedidos.gatewayReferenciaId, payment.id), ne(pedidos.status, "cancelado")))
        .returning();

      if (cancelado) {
        await db.insert(pedidoEventos).values({
          pedidoId: cancelado.id,
          status: "cancelado",
          descricao: "Pagamento estornado.",
        });
        if (cancelado.vendaReportada) {
          await reportarVendaMecproai({
            codigoPedido: cancelado.codigoPedido,
            status: "refunded",
            totalCentavos: Math.round(Number(cancelado.total) * 100),
            email: cancelado.clienteEmail,
            produtoPrincipal: { id: 0, nome: "Pedido" },
            utm: cancelado.atribuicao ?? undefined,
          });
        }
      }
    }

    res.sendStatus(200);
  } catch (erro) {
    console.error("Erro ao processar webhook Asaas:", erro);
    // Responde 200 mesmo em erro interno para evitar reenvios agressivos do
    // gateway; o erro já foi logado para investigação manual.
    res.sendStatus(200);
  }
});

export default asaasWebhookRouter;
