import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { MARCA } from "../../shared/marca";
import { reportarVendaPaga } from "../lib/venda";
import { pedidos, pedidoEventos } from "../../shared/schema";
import { enviarEmail, emailPedidoEnviado, emailPedidoEntregue } from "../lib/email";
import { adminProcedure, router } from "../_core/trpc";

const statusValidos = [
  "aguardando_pagamento",
  "pago",
  "em_producao",
  "pronto_envio",
  "enviado",
  "entregue",
  "cancelado",
] as const;

export const pedidosRouter = router({
  // ── Lista todos os pedidos, mais recentes primeiro ────────────
  listar: adminProcedure.query(async () => {
    return db.query.pedidos.findMany({
      orderBy: desc(pedidos.criadoEm),
    });
  }),

  // ── Detalhe completo de um pedido (itens, cliente, endereço) ──
  buscarPorCodigo: adminProcedure
    .input(z.object({ codigoPedido: z.string() }))
    .query(async ({ input }) => {
      const pedido = await db.query.pedidos.findFirst({
        where: eq(pedidos.codigoPedido, input.codigoPedido),
        with: {
          itens: {
            with: {
              produto: true,
              varianteBanho: true,
              varianteTamanho: true,
            },
          },
          eventos: { orderBy: (e, { desc }) => desc(e.criadoEm) },
        },
      });

      if (!pedido) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }

      return pedido;
    }),

  // ── Atualizar status manualmente (produção, enviado, etc.) ────
  atualizarStatus: adminProcedure
    .input(
      z.object({
        codigoPedido: z.string(),
        status: z.enum(statusValidos),
        transportadora: z.string().optional(),
        codigoRastreio: z.string().optional(),
        descricaoEvento: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [atualizado] = await db
        .update(pedidos)
        .set({
          status: input.status,
          atualizadoEm: new Date(),
          ...(input.transportadora !== undefined && { transportadora: input.transportadora }),
          ...(input.codigoRastreio !== undefined && { codigoRastreio: input.codigoRastreio }),
        })
        .where(eq(pedidos.codigoPedido, input.codigoPedido))
        .returning();

      if (!atualizado) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }

      await db.insert(pedidoEventos).values({
        pedidoId: atualizado.id,
        status: input.status,
        descricao: input.descricaoEvento,
      });

      // Pagamento confirmado na mão (ex: Pix recebido fora do Asaas) também
      // conta como venda pro Meta e pro MecProAI — reportarVendaPaga é
      // idempotente, então não duplica se o webhook já tiver reportado.
      if (input.status === "pago") {
        await reportarVendaPaga(atualizado.id);
      }

      if (input.status === "enviado") {
        await enviarEmail({
          para: atualizado.clienteEmail,
          assunto: `Pedido ${atualizado.codigoPedido} enviado · ${MARCA.nome}`,
          html: emailPedidoEnviado({
            nomeCliente: atualizado.clienteNome,
            codigoPedido: atualizado.codigoPedido,
            transportadora: atualizado.transportadora,
            codigoRastreio: atualizado.codigoRastreio,
          }),
        });
      }

      if (input.status === "entregue") {
        await enviarEmail({
          para: atualizado.clienteEmail,
          assunto: `Pedido ${atualizado.codigoPedido} entregue · ${MARCA.nome}`,
          html: emailPedidoEntregue({
            nomeCliente: atualizado.clienteNome,
            codigoPedido: atualizado.codigoPedido,
          }),
        });
      }

      return atualizado;
    }),
});
