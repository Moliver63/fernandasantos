import { Resend } from "resend";
import { ENV } from "../_core/env";
import { MARCA } from "../../shared/marca";

let clienteResend: Resend | null = null;
export function getResend(): Resend | null {
  if (!ENV.resendApiKey) return null;
  if (!clienteResend) clienteResend = new Resend(ENV.resendApiKey);
  return clienteResend;
}

/**
 * Envia um e-mail via Resend. Se RESEND_API_KEY não estiver configurada,
 * só loga um aviso e segue em frente — nunca derruba o fluxo principal
 * (criar pedido, mudar status) por causa de e-mail.
 *
 * Retorna true/false pra quem precisa saber se realmente saiu (como a
 * resposta manual do admin, onde faz sentido avisar se falhou) — as
 * chamadas automáticas (pedido recebido, etc.) seguem ignorando o
 * retorno, como sempre.
 */
export async function enviarEmail(params: {
  para: string;
  assunto: string;
  html: string;
  remetente?: string;
  responderPara?: string;
}): Promise<boolean> {
  const resend = getResend();

  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY não configurada — e-mail para ${params.para} ("${params.assunto}") não foi enviado.`
    );
    return false;
  }

  try {
    await resend.emails.send({
      from: params.remetente ?? ENV.emailRemetente,
      to: params.para,
      subject: params.assunto,
      html: params.html,
      ...(params.responderPara && { replyTo: params.responderPara }),
    });
    return true;
  } catch (erro) {
    // E-mail é "melhor esforço" — se falhar, loga e segue. O pedido já
    // foi salvo no banco, não faz sentido quebrar a compra por causa
    // de um e-mail que não saiu.
    console.error(`[email] Falha ao enviar e-mail para ${params.para}:`, erro);
    return false;
  }
}

// Paleta da marca nos e-mails (clientes de e-mail não leem Tailwind)
const COR = {
  onix: "#0B0D14",
  ouro: "#D4AF37",
  ouroTexto: "#8A6D1C",
  marfim: "#F5F2E9",
  tinta: "#16181F",
  grafite: "#5E6270",
  linha: "#E2DCCB",
};

const FONTE = "'Montserrat', 'Helvetica Neue', Arial, sans-serif";
const FONTE_TITULO = "'Cinzel', Georgia, serif";

function cabecalhoMarca() {
  return `
    <div style="background:${COR.onix}; padding:28px 24px; text-align:center;">
      <img src="${ENV.siteUrl}/icon-192.png" alt="" width="56" height="56" style="display:block; margin:0 auto 10px; border-radius:50%;" />
      <div style="font-family:${FONTE_TITULO}; font-size:22px; letter-spacing:4px; color:${COR.ouro};">${MARCA.nome.toUpperCase()}</div>
      <div style="font-family:${FONTE}; font-size:10px; letter-spacing:4px; color:${COR.ouro}; opacity:.8; margin-top:4px;">${MARCA.assinatura.toUpperCase()}</div>
    </div>`;
}

function rodapeMarca() {
  const site = ENV.siteUrl.replace(/^https?:\/\//, "");
  return `
    <div style="padding:20px 24px; border-top:1px solid ${COR.linha}; font-size:12px; color:${COR.grafite}; text-align:center; line-height:1.7;">
      <a href="${ENV.siteUrl}" style="color:${COR.ouroTexto}; text-decoration:none;">${site}</a>
      &nbsp;·&nbsp;
      <a href="${MARCA.instagramUrl}" style="color:${COR.ouroTexto}; text-decoration:none;">@${MARCA.instagramUsuario}</a>
      <br/>${MARCA.nomeCompleto}
    </div>`;
}

function envelopeHtml(conteudo: string) {
  return `
    <div style="background:${COR.marfim}; padding:24px 0;">
      <div style="font-family:${FONTE}; max-width:520px; margin:0 auto; background:#ffffff; color:${COR.tinta}; font-size:15px; line-height:1.6;">
        ${cabecalhoMarca()}
        <div style="padding:28px 24px;">${conteudo}</div>
        ${rodapeMarca()}
      </div>
    </div>
  `;
}

function titulo(texto: string) {
  return `<h1 style="font-family:${FONTE_TITULO}; font-weight:500; font-size:20px; color:${COR.tinta}; margin:0 0 16px;">${texto}</h1>`;
}

function botao(href: string, texto: string) {
  return `<p style="margin:24px 0;"><a href="${href}" style="display:inline-block; background:${COR.onix}; color:${COR.ouro}; padding:12px 22px; text-decoration:none; font-size:13px; letter-spacing:2px; text-transform:uppercase;">${texto}</a></p>`;
}

export function emailPedidoRecebido(params: {
  nomeCliente: string;
  codigoPedido: string;
  prazoProducaoDias: number;
}) {
  return envelopeHtml(`
    ${titulo("Recebemos seu pedido")}
    <p>Olá, ${escaparHtml(params.nomeCliente)}!</p>
    <p>
      Seu pedido <strong>${params.codigoPedido}</strong> foi registrado e está
      aguardando a confirmação do pagamento. Assim que ele cair, separamos sua
      joia, conferimos o acabamento e embalamos para presente.
    </p>
    <p>Prazo de preparo: até <strong>${params.prazoProducaoDias} dia(s) útil(eis)</strong> após o pagamento.</p>
    ${botao(`${ENV.siteUrl}/rastreio`, "Acompanhar pedido")}
  `);
}

export function emailPedidoEnviado(params: {
  nomeCliente: string;
  codigoPedido: string;
  transportadora?: string | null;
  codigoRastreio?: string | null;
}) {
  return envelopeHtml(`
    ${titulo("Sua joia está a caminho")}
    <p>Olá, ${escaparHtml(params.nomeCliente)}!</p>
    <p>O pedido <strong>${params.codigoPedido}</strong> acabou de ser despachado.</p>
    ${
      params.codigoRastreio
        ? `<p>Transportadora: <strong>${escaparHtml(params.transportadora ?? "—")}</strong><br/>
           Código de rastreio: <strong>${escaparHtml(params.codigoRastreio)}</strong></p>`
        : ""
    }
    ${botao(`${ENV.siteUrl}/rastreio`, "Ver status do pedido")}
  `);
}

export function emailBoasVindasNewsletter() {
  return envelopeHtml(`
    ${titulo("Que bom ter você aqui")}
    <p>
      A partir de agora você recebe em primeira mão os lançamentos, reposições
      e condições especiais da ${MARCA.nome}. Prometemos pouco e-mail e só
      o que valer a pena.
    </p>
    ${botao(ENV.siteUrl, "Ver as joias")}
  `);
}

export function emailPagamentoConfirmado(params: { nomeCliente: string; codigoPedido: string }) {
  return envelopeHtml(`
    ${titulo("Pagamento confirmado")}
    <p>Olá, ${escaparHtml(params.nomeCliente)}!</p>
    <p>
      O pagamento do pedido <strong>${params.codigoPedido}</strong> foi confirmado.
      Sua joia já está sendo separada e embalada. Avisamos por aqui quando ela
      for despachada.
    </p>
  `);
}

export function emailPedidoEntregue(params: { nomeCliente: string; codigoPedido: string }) {
  return envelopeHtml(`
    ${titulo("Sua joia chegou")}
    <p>Olá, ${escaparHtml(params.nomeCliente)}!</p>
    <p>
      O pedido <strong>${params.codigoPedido}</strong> foi entregue. Esperamos que
      você ame usar tanto quanto amamos preparar.
    </p>
    <p>
      Uma dica para o brilho durar: evite perfume, cremes, cloro e água do mar,
      e guarde cada peça separada no saquinho ou no estojo.
    </p>
    <p>Se postar, marca a gente no Instagram: <a href="${MARCA.instagramUrl}" style="color:${COR.ouroTexto};">@${MARCA.instagramUsuario}</a></p>
  `);
}

export function emailNovoProduto(params: { nomeProduto: string; slug: string; descricao?: string | null }) {
  return envelopeHtml(`
    ${titulo("Acabou de chegar")}
    <p style="font-family:${FONTE_TITULO}; font-size:18px; margin:0 0 8px;">${escaparHtml(params.nomeProduto)}</p>
    ${params.descricao ? `<p style="color:${COR.grafite};">${escaparHtml(params.descricao)}</p>` : ""}
    ${botao(`${ENV.siteUrl}/produto/${params.slug}`, "Ver a joia")}
  `);
}

export function emailLembreteAbandono(params: { nomeCliente: string; codigoPedido: string }) {
  return envelopeHtml(`
    ${titulo("Sua joia ainda está separada")}
    <p>Olá, ${escaparHtml(params.nomeCliente)}!</p>
    <p>
      O pedido <strong>${params.codigoPedido}</strong> ficou aguardando o pagamento.
      Se ainda quiser, é só concluir pelo link que enviamos ou responder este
      e-mail que a gente ajuda.
    </p>
    <p>Se mudou de ideia, tudo bem. Pode ignorar esta mensagem.</p>
  `);
}

// ──────────────────────────────────────────────────────────
// Assinatura da caixa de contato — tom mais pessoal que o envelope
// transacional. URLs precisam ser absolutas (clientes de e-mail não
// resolvem caminho relativo).
// ──────────────────────────────────────────────────────────

function assinaturaContatoHtml() {
  const site = ENV.siteUrl.replace(/^https?:\/\//, "");
  return `
    <div style="margin-top: 28px; padding-top: 18px; border-top: 1px solid ${COR.linha};">
      <p style="margin: 0 0 4px; font-family:${FONTE_TITULO}; letter-spacing:3px; color:${COR.ouroTexto};">${MARCA.nome.toUpperCase()}</p>
      <p style="margin: 0; font-size: 13px; color: ${COR.grafite}; line-height: 1.6;">
        ${MARCA.responsavel}<br/>
        <a href="${ENV.siteUrl}" style="color: ${COR.ouroTexto}; text-decoration: none;">${site}</a>
        &nbsp;·&nbsp;
        <a href="${MARCA.instagramUrl}" style="color: ${COR.ouroTexto}; text-decoration: none;">@${MARCA.instagramUsuario}</a>
      </p>
    </div>
  `;
}

function escaparHtml(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
}

/**
 * Corpo de uma resposta manual do admin a uma mensagem recebida em
 * contato@ — o texto vem cru de um textarea (sem HTML), por isso escapa
 * antes de virar HTML, e sempre fecha com a assinatura da marca.
 */
export function emailRespostaContato(params: {
  corpoResposta: string;
  citacao?: { remetente: string; data: string; corpo: string };
}) {
  return `
    <div style="font-family: Montserrat, Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #16181F; font-size: 15px; line-height: 1.6;">
      <div>${escaparHtml(params.corpoResposta)}</div>
      ${assinaturaContatoHtml()}
      ${
        params.citacao
          ? `
        <div style="margin-top: 24px; padding-left: 12px; border-left: 2px solid #E2DCCB; color: #5E6270; font-size: 13px;">
          <p style="margin: 0 0 6px;">Em ${params.citacao.data}, ${escaparHtml(params.citacao.remetente)} escreveu:</p>
          <div>${escaparHtml(params.citacao.corpo)}</div>
        </div>
      `
          : ""
      }
    </div>
  `;
}
