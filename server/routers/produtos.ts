/**
 * produtos.ts — Router tRPC de produtos
 * Localização: server/routers/produtos.ts
 *
 * No frontend, as chamadas ficam:
 *   trpc.produtos.listar.useQuery({ categoria: "casa" })
 *   trpc.produtos.buscarPorSlug.useQuery({ slug: "prato-oval-azul" })
 *   trpc.produtos.criar.useMutation()
 *   trpc.produtos.atualizar.useMutation()
 *   trpc.produtos.criarVarianteBanho.useMutation()
 *   trpc.produtos.criarVarianteTamanho.useMutation()
 */

import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { MARCA } from "../../shared/marca";
import { produtos, itensKit, variantesBanho, variantesTamanho, leads } from "../../shared/schema";
import { CATEGORIAS_VALIDAS } from "../../shared/const";
import { enviarEmail, emailNovoProduto } from "../lib/email";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";

const categoriaSchema = z.enum(CATEGORIAS_VALIDAS);
const tipoPersonalizacaoSchema = z.enum(["gravacao"]);

export const produtosRouter = router({
  // ── Listar produtos ativos (vitrine), com filtro opcional ──
  listar: publicProcedure
    .input(
      z
        .object({
          categoria: categoriaSchema.optional(),
          destaque: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const filtros = [eq(produtos.ativo, true)];
      if (input?.categoria) filtros.push(eq(produtos.categoria, input.categoria));
      if (input?.destaque) filtros.push(eq(produtos.destaque, true));

      return db.query.produtos.findMany({
        where: and(...filtros),
        orderBy: [desc(produtos.destaque), desc(produtos.criadoEm)],
        with: { variantesBanho: true, variantesTamanho: true },
      });
    }),

  // ── Listar tudo, inclusive inativos (admin) ──────────────────
  listarAdmin: adminProcedure.query(async () => {
    return db.query.produtos.findMany({
      orderBy: [desc(produtos.criadoEm)],
      with: { variantesBanho: true, variantesTamanho: true },
    });
  }),

  // ── Busca textual simples (nome, descrição, material) ─────────
  buscar: publicProcedure
    .input(z.object({ termo: z.string().trim().min(2).max(60) }))
    .query(async ({ input }) => {
      const termo = input.termo
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      const todos = await db.query.produtos.findMany({
        where: eq(produtos.ativo, true),
        with: { variantesBanho: true, variantesTamanho: true },
      });
      const normalizar = (t: string | null | undefined) =>
        (t ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      return todos
        .filter((p) =>
          [p.nome, p.descricao, p.material, p.pedras, p.categoria].some((c) =>
            normalizar(c).includes(termo)
          )
        )
        .slice(0, 24);
    }),

  // ── Buscar um produto pelo slug ──────────────────────────────
  buscarPorSlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const produto = await db.query.produtos.findFirst({
        where: eq(produtos.slug, input.slug),
        with: { variantesBanho: true, variantesTamanho: true },
      });

      // Peça inativa só aparece pro admin (pra poder editar)
      if (!produto || (!produto.ativo && !ctx.isAdmin)) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Produto não encontrado",
        });
      }

      if (produto.ehKit) {
        const itens = await db.query.itensKit.findMany({
          where: eq(itensKit.kitId, produto.id),
          with: { produto: true },
        });
        return { ...produto, itensDoKit: itens };
      }

      return produto;
    }),

  // ── Criar produto (admin) ────────────────────────────────────
  criar: adminProcedure
    .input(
      z.object({
        nome: z.string().min(1),
        slug: z.string().min(1),
        categoria: categoriaSchema,
        descricao: z.string().optional(),
        precoBase: z.string(),
        precoPromocional: z.string().nullable().optional(),
        material: z.string().optional(),
        pedras: z.string().optional(),
        dimensoes: z.string().optional(),
        garantiaMeses: z.number().int().min(0).max(120).default(12),
        hipoalergenica: z.boolean().default(true),
        destaque: z.boolean().default(false),
        novidade: z.boolean().default(false),
        personalizavel: z.boolean().default(false),
        tipoPersonalizacao: tipoPersonalizacaoSchema.optional(),
        custoPersonalizacao: z.string().optional(),
        precoSobConsulta: z.boolean().default(false),
        controlarEstoque: z.boolean().default(false),
        estoque: z.number().int().min(0).default(0),
        ehKit: z.boolean().default(false),
        prazoProducaoDias: z.number().int().positive().default(2),
        cuidados: z.string().optional(),
        imagens: z.array(z.string()).default([]),
        ativo: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const [novo] = await db.insert(produtos).values(input).returning();
        return novo;
      } catch (erro) {
        console.error("Erro ao criar produto:", erro);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não foi possível criar o produto. Verifique os dados enviados.",
        });
      }
    }),

  // ── Atualizar produto (admin) ────────────────────────────────
  atualizar: adminProcedure
    .input(
      z.object({
        id: z.number().int(),
        dados: z.record(z.string(), z.unknown()),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const [atualizado] = await db
          .update(produtos)
          .set({ ...input.dados, atualizadoEm: new Date() })
          .where(eq(produtos.id, input.id))
          .returning();

        if (!atualizado) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Produto não encontrado" });
        }
        return atualizado;
      } catch (erro) {
        if (erro instanceof TRPCError) throw erro;
        console.error(`Erro ao atualizar produto ${input.id}:`, erro);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não foi possível atualizar o produto. Verifique os dados enviados.",
        });
      }
    }),

  // ── Variantes de cor (esmalte) — admin ───────────────────────
  criarVarianteBanho: adminProcedure
    .input(
      z.object({
        produtoId: z.number().int(),
        nome: z.string().min(1),
        codigoHex: z.string().optional(),
        codigoFornecedor: z.string().optional(),
        imagemUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [nova] = await db.insert(variantesBanho).values(input).returning();
      return nova;
    }),

  removerVarianteBanho: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      await db.delete(variantesBanho).where(eq(variantesBanho.id, input.id));
      return { sucesso: true as const };
    }),

  // ── Variantes de argila — admin ───────────────────────────────
  criarVarianteTamanho: adminProcedure
    .input(
      z.object({
        produtoId: z.number().int(),
        nome: z.string().min(1),
        codigoHex: z.string().optional(),
        imagemUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [nova] = await db.insert(variantesTamanho).values(input).returning();
      return nova;
    }),

  removerVarianteTamanho: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      await db.delete(variantesTamanho).where(eq(variantesTamanho.id, input.id));
      return { sucesso: true as const };
    }),

  // ── Avisar assinantes da newsletter sobre uma peça (manual,
  //    disparado pelo admin — não é automático a cada produto criado,
  //    pra não virar spam se várias peças forem cadastradas seguidas) ──
  notificarNovidade: adminProcedure
    .input(z.object({ produtoId: z.number().int() }))
    .mutation(async ({ input }) => {
      const produto = await db.query.produtos.findFirst({
        where: eq(produtos.id, input.produtoId),
      });
      if (!produto) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Produto não encontrado" });
      }

      const assinantes = await db.query.leads.findMany({
        where: eq(leads.ativo, true),
      });

      const html = emailNovoProduto({
        nomeProduto: produto.nome,
        slug: produto.slug,
        descricao: produto.descricao,
      });

      for (const assinante of assinantes) {
        await enviarEmail({
          para: assinante.email,
          assunto: `Novidade na ${MARCA.nome}: ${produto.nome}`,
          html,
        });
      }

      return { sucesso: true as const, enviados: assinantes.length };
    }),
});
