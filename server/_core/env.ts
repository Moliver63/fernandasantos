import { MARCA } from "../../shared/marca";

export const ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  asaasEnv: process.env.ASAAS_ENV ?? "sandbox",
  asaasApiKey: process.env.ASAAS_API_KEY ?? "",
  // Token configurado no painel do Asaas (Integrações > Webhooks). O Asaas
  // manda esse valor no header `asaas-access-token` — sem conferir isso,
  // qualquer um poderia marcar um pedido como pago com um POST forjado.
  asaasWebhookToken: process.env.ASAAS_WEBHOOK_TOKEN ?? "",
  isProduction: process.env.NODE_ENV === "production",
  port: parseInt(process.env.PORT || "4000", 10),

  // URL pública do site (sem barra no final). Usada em sitemap, e-mails,
  // prévias sociais e Conversions API.
  siteUrl: (process.env.SITE_URL ?? MARCA.siteUrl).replace(/\/$/, ""),

  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  // Segredo usado pra assinar o cookie de sessão do admin — não é a senha.
  adminSessionSecret: process.env.ADMIN_SESSION_SECRET ?? "",

  // Cloudflare Images — upload direto do navegador (fotos das peças)
  cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? "",
  cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN ?? "",

  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailRemetente: process.env.EMAIL_REMETENTE ?? `${MARCA.nome} <pedidos@fsjoias.com.br>`,
  emailContato: process.env.EMAIL_CONTATO ?? `${MARCA.nome} <${MARCA.emailContato}>`,
  resendWebhookSecret: process.env.RESEND_WEBHOOK_SECRET ?? "",
  cronSecret: process.env.CRON_SECRET ?? "",

  // ── Marketing / mensuração (herdado do MecProAI) ──────────────
  metaPixelId: process.env.META_PIXEL_ID ?? "",
  // Token da Conversions API (Gerenciador de Eventos > Configurações)
  metaCapiToken: process.env.META_CAPI_TOKEN ?? "",
  // Opcional: código de teste do Gerenciador de Eventos (aba "Testar eventos")
  metaTestEventCode: process.env.META_TEST_EVENT_CODE ?? "",
  ga4Id: process.env.GA4_MEASUREMENT_ID ?? "",
  // URL do webhook de vendas criada no MecProAI (create_sales_webhook,
  // provider "kiwify"). Cada venda paga é reportada no formato Kiwify,
  // e o MecProAI atribui à campanha pelo utm_campaign=mp{id}.
  mecproaiWebhookUrl: process.env.MECPROAI_SALES_WEBHOOK_URL ?? "",
  // Opcional: o mesmo "verifySecret" usado ao criar o webhook no MecProAI
  mecproaiWebhookSecret: process.env.MECPROAI_SALES_WEBHOOK_SECRET ?? "",

  // Instagram (Graph API) — token de longa duração da conta profissional.
  // Sem token, a vitrine do Instagram na Home mostra só o convite pro perfil.
  instagramToken: process.env.INSTAGRAM_ACCESS_TOKEN ?? "",
};
