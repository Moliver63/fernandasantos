// Fonte única dos dados da marca — usado no client e no server.
// Trocar telefone, domínio ou rede social é só mexer aqui.

export const MARCA = {
  nome: "FS Joias",
  nomeCompleto: "FS Joias · Fernanda Santos",
  assinatura: "Joias e Alianças",
  responsavel: "Fernanda Santos",

  // Domínio de produção. Enquanto o domínio não estiver apontado, o
  // server usa SITE_URL do ambiente (ver server/_core/env.ts).
  siteUrl: "https://www.fsjoias.com.br",

  instagramUsuario: "fersantos_semijoias",
  instagramUrl: "https://www.instagram.com/fersantos_semijoias/",

  // WhatsApp no formato internacional, só dígitos (55 + DDD + número).
  // Vazio = o botão flutuante abre o Direct do Instagram no lugar.
  whatsapp: "5547999143188",

  emailContato: "contato@fsjoias.com.br",
  cidade: "Balneário Camboriú/SC",

  // Prefixo do código de pedido (ex: FS-2026-4821)
  prefixoPedido: "FS",
} as const;

export function linkAtendimento(mensagem: string): string {
  if (MARCA.whatsapp) {
    return `https://wa.me/${MARCA.whatsapp}?text=${encodeURIComponent(mensagem)}`;
  }
  return `https://ig.me/m/${MARCA.instagramUsuario}`;
}
