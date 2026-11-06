# FS Joias · Fernanda Santos

E-commerce de joias e alianças da **FS Joias** (Instagram [@fersantos_semijoias](https://www.instagram.com/fersantos_semijoias/)).

Base técnica: arquitetura do **Caro Vargas Cerâmica** (já validada em produção), domínio de joias vindo do
**docce-luxxo** e a camada de mensuração do **MecProAI**.

## Stack

- React 19 + Vite + Tailwind (client) · Express + tRPC 11 (server) · Drizzle ORM + PostgreSQL
- Pacote único, um processo só (dev e produção na mesma porta), deploy no Render
- Asaas (Pix/boleto/cartão) · Resend (e-mails) · Cloudflare Images (fotos)
- Meta Pixel + Conversions API · GA4 · webhook de vendas do MecProAI

## Rodar local

```bash
cp .env.example .env        # preencha ao menos DATABASE_URL e ADMIN_*
npm install
npm run db:migrate          # cria as tabelas (drizzle/0000_inicial.sql)
npm run seed                # catálogo de DEMONSTRAÇÃO (apagar antes de ir ao ar)
npm run dev                 # http://localhost:4000
```

Produção: `npm run build` e `npm start`. Nunca usar `drizzle-kit push` em produção, só `db:migrate`.

## O que tem

**Loja**
- Identidade do manual de marca: Cinzel + Montserrat, Dourado Nobre `#D4AF37`, Preto `#0B0D14`,
  Azul Profundo `#0E223D`, Off White `#F5F2E9`. Monograma FS vetorizado (`components/Monograma.tsx`).
- Categorias: anéis, brincos, colares, pulseiras, alianças, conjuntos (`shared/const.ts`).
- Peça com **banho** (bolinha de cor), **aro/tamanho**, **gravação** de texto, preço "de/por",
  ficha técnica, garantia, cálculo de frete por CEP, peças relacionadas, barra fixa de compra no celular.
- Sacola persistente (sobrevive a F5), mini-sacola lateral, favoritos sem login, busca.
- Checkout em 3 etapas com ViaCEP, **5% off no Pix**, QR Code Pix + copia e cola na confirmação.
- Página "A marca" com cuidados, garantia/trocas e tabela de aros.
- SEO: JSON-LD (JewelryStore, Product, FAQ), sitemap dinâmico, prévia de link para WhatsApp/Instagram, PWA manifest.

**Painel `/admin`** (herdado do Caro Vargas): produtos com upload múltiplo, banhos com atalhos
(Ouro 18k, Ródio, Rosé…), gerador de aros, pedidos com linha do tempo e rastreio, clientes, leads,
caixa de e-mail, financeiro, banners das categorias.

**Mensuração (MecProAI)**
- UTMs + fbclid/gclid guardados na primeira visita (30 dias) e gravados no pedido.
- Pagamento confirmado no Asaas → `Purchase` pela **Conversions API** (event_id = código do pedido)
  e **venda reportada ao MecProAI** no formato Kiwify, atribuída pela `utm_campaign=mp{id}`.
  Estorno vira `refunded`. Cada venda é reportada uma vez só (`venda_reportada`).
- Para ligar: no MecProAI rode `create_sales_webhook({ projectId, provider: "kiwify" })` e cole a URL em
  `MECPROAI_SALES_WEBHOOK_URL`.

## Correções em relação à base

- **Preço recalculado no servidor.** Antes o checkout aceitava o `precoUnitario` enviado pelo navegador.
- **Webhook do Asaas autenticado** (`asaas-access-token`) e sem regredir status de pedido já enviado.
- O cliente agora **vê o Pix/boleto** depois de finalizar (antes a resposta do Asaas era descartada).
- Catálogo por categoria não lista mais peças inativas; admin ganhou `listarAdmin` para vê-las.
- Nomes de cliente escapados nos e-mails.

## Antes de ir ao ar

- [x] WhatsApp (47) 99914-3188 em `shared/marca.ts`
- [ ] Confirmar **domínio** (`SITE_URL`, `shared/marca.ts`, `client/index.html`, `robots.txt`)
- [ ] Confirmar com a Fernanda os textos de política: garantia de 12 meses, "antialérgicas/livres de
      níquel", embalagem para presente, prazo de envio, 5% no Pix e 6x sem juros
      (`shared/const.ts`: `DESCONTO_PIX`, `PARCELAS_MAX`)
- [ ] Apagar o catálogo de demonstração e cadastrar as peças reais com fotos
- [ ] `og-banner.jpg` (1200×630) em `client/public/marca/`
- [ ] Tabela de frete provisória em `server/routers/frete.ts` (trocar por Melhor Envio quando houver conta)
