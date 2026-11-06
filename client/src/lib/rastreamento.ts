/**
 * rastreamento.ts — Pixel do Meta, GA4 e atribuição de campanha.
 *
 * Mesma lógica de mensuração do MecProAI:
 *  - Na primeira visita, guarda UTMs + fbclid/gclid (first-touch, 30 dias).
 *    Os anúncios do MecProAI saem com utm_campaign=mp{id}; é esse valor que
 *    volta no pedido e permite atribuir a venda à campanha certa.
 *  - O Pixel e o GA4 só carregam se o server tiver os IDs configurados
 *    (trpc.config.publico) — nada é chumbado no bundle.
 *  - O Purchase do navegador usa eventID = código do pedido; o server manda
 *    o mesmo evento pela Conversions API e o Meta deduplica.
 */

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean };
    _fbq?: unknown;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const CHAVE_ATRIBUICAO = "fsjoias:atribuicao:v1";
const VALIDADE_MS = 30 * 24 * 60 * 60 * 1000;

export interface Atribuicao {
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
}

function lerCookie(nome: string): string | undefined {
  const m = document.cookie.match(new RegExp(`(?:^|; )${nome}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}

/** Chamado uma vez no boot do app. */
export function capturarAtribuicao() {
  try {
    const p = new URLSearchParams(window.location.search);
    const daUrl: Atribuicao = {
      utmSource: p.get("utm_source") ?? undefined,
      utmMedium: p.get("utm_medium") ?? undefined,
      utmCampaign: p.get("utm_campaign") ?? undefined,
      utmContent: p.get("utm_content") ?? undefined,
      utmTerm: p.get("utm_term") ?? undefined,
      fbclid: p.get("fbclid") ?? undefined,
      gclid: p.get("gclid") ?? undefined,
    };
    const temCampanha = Object.values(daUrl).some(Boolean);

    const salvo = localStorage.getItem(CHAVE_ATRIBUICAO);
    const anterior = salvo ? (JSON.parse(salvo) as { quando: number; dados: Atribuicao }) : null;
    const expirado = !anterior || Date.now() - anterior.quando > VALIDADE_MS;

    // Clique novo em anúncio sobrescreve; visita orgânica não apaga o anúncio
    if (temCampanha || expirado) {
      const dados: Atribuicao = {
        ...daUrl,
        landingPage: window.location.pathname + window.location.search,
        referrer: document.referrer || undefined,
      };
      if (daUrl.fbclid) {
        // Formato do cookie _fbc definido pelo Meta: fb.1.<timestamp>.<fbclid>
        dados.fbc = `fb.1.${Date.now()}.${daUrl.fbclid}`;
      }
      localStorage.setItem(CHAVE_ATRIBUICAO, JSON.stringify({ quando: Date.now(), dados }));
    }
  } catch {
    /* localStorage indisponível — segue sem atribuição */
  }
}

export function lerAtribuicao(): Atribuicao {
  let dados: Atribuicao = {};
  try {
    const salvo = localStorage.getItem(CHAVE_ATRIBUICAO);
    if (salvo) dados = (JSON.parse(salvo) as { dados: Atribuicao }).dados ?? {};
  } catch {
    /* ignora */
  }
  return {
    ...dados,
    fbp: lerCookie("_fbp") ?? dados.fbp,
    fbc: lerCookie("_fbc") ?? dados.fbc,
  };
}

let pixelId: string | null = null;
let ga4Id: string | null = null;

export function iniciarPixels(config: { metaPixelId: string | null; ga4Id: string | null }) {
  if (config.metaPixelId && !window.fbq) {
    pixelId = config.metaPixelId;
    const fbq = function (...args: unknown[]) {
      (fbq as unknown as { queue: unknown[] }).queue.push(args);
    } as NonNullable<Window["fbq"]>;
    fbq.queue = [];
    fbq.loaded = true;
    window.fbq = fbq;
    window._fbq = fbq;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
    window.fbq("init", pixelId);
    window.fbq("track", "PageView");
  }

  if (config.ga4Id && !window.gtag) {
    ga4Id = config.ga4Id;
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function (...args: unknown[]) {
      window.dataLayer!.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("config", ga4Id);
  }
}

const MAPA_GA4: Record<string, string> = {
  ViewContent: "view_item",
  AddToCart: "add_to_cart",
  InitiateCheckout: "begin_checkout",
  Purchase: "purchase",
  Lead: "generate_lead",
  Search: "search",
};

/** Evento padrão do Meta, espelhado no GA4 quando existir. */
export function rastrear(
  evento: "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase" | "Lead" | "Search",
  dados: Record<string, unknown> = {},
  eventId?: string
) {
  try {
    if (pixelId && window.fbq) {
      window.fbq("track", evento, dados, eventId ? { eventID: eventId } : undefined);
    }
    if (ga4Id && window.gtag) {
      window.gtag("event", MAPA_GA4[evento] ?? evento, {
        currency: dados.currency,
        value: dados.value,
        transaction_id: eventId,
      });
    }
  } catch {
    /* rastreamento nunca pode quebrar a loja */
  }
}

export function paginaVista() {
  try {
    if (pixelId && window.fbq) window.fbq("track", "PageView");
    if (ga4Id && window.gtag) window.gtag("event", "page_view", { page_path: window.location.pathname });
  } catch {
    /* ignora */
  }
}
