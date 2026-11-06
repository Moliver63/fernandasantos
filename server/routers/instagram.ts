/**
 * instagram.ts — últimas postagens do @ da marca para a vitrine da Home.
 *
 * Usa a Instagram Graph API (conta profissional) com um token de longa
 * duração em INSTAGRAM_ACCESS_TOKEN. Resultado fica 30 min em cache em
 * memória: a Home não pode depender da latência (nem do limite de taxa)
 * da API do Instagram a cada visita. Sem token, devolve lista vazia e o
 * front mostra só o convite para seguir o perfil.
 */
import { publicProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";

type Post = {
  id: string;
  legenda: string;
  imagem: string;
  link: string;
  tipo: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
};

let cache: { quando: number; posts: Post[] } | null = null;
const TTL_MS = 30 * 60 * 1000;

async function buscarPosts(): Promise<Post[]> {
  if (!ENV.instagramToken) return [];
  if (cache && Date.now() - cache.quando < TTL_MS) return cache.posts;

  try {
    const campos = "id,caption,media_type,media_url,thumbnail_url,permalink";
    const resp = await fetch(
      `https://graph.instagram.com/me/media?fields=${campos}&limit=12&access_token=${encodeURIComponent(ENV.instagramToken)}`
    );
    if (!resp.ok) {
      console.error("[instagram] API respondeu", resp.status, await resp.text());
      return cache?.posts ?? [];
    }
    const json = (await resp.json()) as {
      data?: {
        id: string;
        caption?: string;
        media_type: Post["tipo"];
        media_url?: string;
        thumbnail_url?: string;
        permalink: string;
      }[];
    };
    const posts: Post[] = (json.data ?? [])
      .map((m) => ({
        id: m.id,
        legenda: (m.caption ?? "").slice(0, 160),
        imagem: (m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url) ?? "",
        link: m.permalink,
        tipo: m.media_type,
      }))
      .filter((p) => p.imagem)
      .slice(0, 8);
    cache = { quando: Date.now(), posts };
    return posts;
  } catch (erro) {
    console.error("[instagram] Falha ao buscar posts:", erro);
    return cache?.posts ?? [];
  }
}

export const instagramRouter = router({
  ultimosPosts: publicProcedure.query(() => buscarPosts()),
});
