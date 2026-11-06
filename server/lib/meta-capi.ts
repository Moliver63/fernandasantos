/**
 * meta-capi.ts — Conversions API do Meta (servidor → Meta)
 *
 * Por que existe: o Pixel no navegador perde parte das compras (bloqueador
 * de anúncio, iOS, aba fechada antes do Pix cair). A venda só é confirmada
 * de verdade quando o Asaas avisa o pagamento — e isso acontece no
 * servidor. Mandando o Purchase daqui, com o mesmo event_id que o Pixel
 * usou, o Meta deduplica e as campanhas otimizam por venda real.
 *
 * Mesmo padrão de "melhor esforço" do e-mail: nunca derruba o fluxo.
 */

import { createHash } from "node:crypto";
import { ENV } from "../_core/env";

const GRAPH_VERSION = "v21.0";

function sha256(valor: string | null | undefined): string | undefined {
  if (!valor) return undefined;
  const normalizado = valor.trim().toLowerCase();
  if (!normalizado) return undefined;
  return createHash("sha256").update(normalizado).digest("hex");
}

function somenteDigitos(v?: string | null) {
  return (v ?? "").replace(/\D/g, "");
}

export interface EventoCompra {
  eventId: string; // = código do pedido (dedupe com o Pixel)
  valor: number;
  moeda?: string;
  email: string;
  telefone?: string | null;
  nome?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
  fbp?: string;
  fbc?: string;
  ip?: string;
  userAgent?: string;
  urlOrigem?: string;
  produtos: { id: number; quantidade: number; preco: number }[];
  quando?: Date;
}

export function metaCapiConfigurado() {
  return Boolean(ENV.metaPixelId && ENV.metaCapiToken);
}

export async function enviarCompraMeta(e: EventoCompra): Promise<boolean> {
  if (!metaCapiConfigurado()) return false;

  const telefone = somenteDigitos(e.telefone);
  const [primeiroNome, ...resto] = (e.nome ?? "").trim().split(/\s+/);

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor((e.quando ?? new Date()).getTime() / 1000),
        event_id: e.eventId,
        action_source: "website",
        event_source_url: e.urlOrigem ?? ENV.siteUrl,
        user_data: {
          em: [sha256(e.email)].filter(Boolean),
          ph: telefone ? [sha256(telefone.startsWith("55") ? telefone : `55${telefone}`)] : undefined,
          fn: primeiroNome ? [sha256(primeiroNome)] : undefined,
          ln: resto.length ? [sha256(resto.join(" "))] : undefined,
          ct: e.cidade ? [sha256(e.cidade.replace(/\s/g, ""))] : undefined,
          st: e.uf ? [sha256(e.uf)] : undefined,
          zp: e.cep ? [sha256(somenteDigitos(e.cep))] : undefined,
          country: [sha256("br")],
          fbp: e.fbp,
          fbc: e.fbc,
          client_ip_address: e.ip,
          client_user_agent: e.userAgent,
        },
        custom_data: {
          currency: e.moeda ?? "BRL",
          value: Number(e.valor.toFixed(2)),
          content_type: "product",
          content_ids: e.produtos.map((p) => String(p.id)),
          contents: e.produtos.map((p) => ({
            id: String(p.id),
            quantity: p.quantidade,
            item_price: p.preco,
          })),
          order_id: e.eventId,
        },
      },
    ],
    ...(ENV.metaTestEventCode && { test_event_code: ENV.metaTestEventCode }),
  };

  try {
    const resp = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${ENV.metaPixelId}/events?access_token=${encodeURIComponent(ENV.metaCapiToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!resp.ok) {
      console.error("[meta-capi] Meta recusou o evento:", resp.status, await resp.text());
      return false;
    }
    return true;
  } catch (erro) {
    console.error("[meta-capi] Falha ao enviar evento:", erro);
    return false;
  }
}
