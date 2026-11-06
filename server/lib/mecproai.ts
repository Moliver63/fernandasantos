/**
 * mecproai.ts — reporta cada venda paga ao MecProAI
 *
 * O MecProAI recebe vendas por webhook (Kiwify/Hotmart) e atribui cada uma
 * à campanha que gerou o clique, pelo utm_campaign=mp{id} que ele mesmo
 * coloca nos anúncios. Esta loja não é Kiwify, mas manda o payload no
 * MESMO formato — assim nenhuma mudança é necessária no MecProAI:
 *
 *   1. No MecProAI: create_sales_webhook({ projectId, provider: "kiwify" })
 *   2. Cole a URL retornada em MECPROAI_SALES_WEBHOOK_URL (Render → Environment)
 *   3. Se usou verifySecret, cole o mesmo valor em MECPROAI_SALES_WEBHOOK_SECRET
 *
 * Campos usados pelo parser do MecProAI (server/salesWebhookParsing.ts):
 * order_id, order_status, webhook_event_type, Commissions.charge_amount
 * (centavos), Product.*, Customer.email (vira hash lá), TrackingParameters.
 */

import { createHmac } from "node:crypto";
import { ENV } from "../_core/env";

export interface VendaMecpro {
  codigoPedido: string;
  status: "paid" | "refunded";
  totalCentavos: number;
  email: string;
  produtoPrincipal: { id: number; nome: string };
  utm?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
  };
  quando?: Date;
}

export function mecproaiConfigurado() {
  return Boolean(ENV.mecproaiWebhookUrl);
}

export async function reportarVendaMecproai(v: VendaMecpro): Promise<boolean> {
  if (!mecproaiConfigurado()) return false;

  const corpo = JSON.stringify({
    order_id: v.codigoPedido,
    order_status: v.status,
    webhook_event_type: v.status === "paid" ? "order_approved" : "order_refunded",
    approved_date: (v.quando ?? new Date()).toISOString(),
    Commissions: { charge_amount: v.totalCentavos, currency: "BRL" },
    Product: { product_id: String(v.produtoPrincipal.id), product_name: v.produtoPrincipal.nome },
    Customer: { email: v.email },
    TrackingParameters: {
      utm_source: v.utm?.utmSource ?? null,
      utm_medium: v.utm?.utmMedium ?? null,
      utm_campaign: v.utm?.utmCampaign ?? null,
      utm_content: v.utm?.utmContent ?? null,
      utm_term: v.utm?.utmTerm ?? null,
      src: v.utm?.utmCampaign ?? null,
    },
    store: "fsjoias",
  });

  let url = ENV.mecproaiWebhookUrl;
  if (ENV.mecproaiWebhookSecret) {
    // Mesmo esquema da Kiwify: HMAC-SHA1 (hex) do corpo bruto na query
    const assinatura = createHmac("sha1", ENV.mecproaiWebhookSecret).update(corpo).digest("hex");
    url += (url.includes("?") ? "&" : "?") + `signature=${assinatura}`;
  }

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: corpo,
    });
    if (!resp.ok) {
      console.error("[mecproai] Webhook de vendas recusou:", resp.status, await resp.text());
      return false;
    }
    return true;
  } catch (erro) {
    console.error("[mecproai] Falha ao reportar venda:", erro);
    return false;
  }
}
