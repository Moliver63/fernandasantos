import { Link } from "wouter";
import { trpc } from "../lib/trpc";
import { CATEGORIAS, DESCONTO_PIX, PARCELAS_MAX } from "@shared/const";
import { MARCA } from "@shared/marca";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProdutoCard from "../components/ProdutoCard";
import GradeProdutos, { GradeEsqueleto } from "../components/GradeProdutos";
import Monograma from "../components/Monograma";
import Seo from "../components/Seo";
import { IconeCaminhao, IconeDiamante, IconeEscudo, IconeInstagram, IconePix, IconePresente } from "../components/Icones";
import { jsonLdSeguro } from "../lib/jsonld";

function Titulo({ eyebrow, titulo, claro = false }: { eyebrow: string; titulo: string; claro?: boolean }) {
  return (
    <div className="text-center">
      <p className={`eyebrow ${claro ? "text-ouro" : "text-ouro-profundo"}`}>{eyebrow}</p>
      <h2 className={`mt-3 font-display text-3xl md:text-4xl ${claro ? "text-marfim" : "text-tinta"}`}>{titulo}</h2>
      <div className="filete mx-auto mt-5 w-40 text-[0.6rem]">◆</div>
    </div>
  );
}

function Instagram() {
  const { data: posts = [] } = trpc.instagram.ultimosPosts.useQuery(undefined, { staleTime: 10 * 60 * 1000 });

  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
      <Titulo eyebrow="No Instagram" titulo={`@${MARCA.instagramUsuario}`} />
      {posts.length > 0 ? (
        <div className="mt-12 grid grid-cols-2 gap-2 md:grid-cols-4">
          {posts.map((p) => (
            <a
              key={p.id}
              href={p.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden bg-linha/40"
            >
              <img src={p.imagem} alt={p.legenda || "Post do Instagram"} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <span className="absolute inset-0 flex items-center justify-center bg-onix/0 text-marfim opacity-0 transition group-hover:bg-onix/40 group-hover:opacity-100">
                <IconeInstagram className="h-8 w-8" />
              </span>
            </a>
          ))}
        </div>
      ) : (
        <p className="mx-auto mt-8 max-w-md text-center text-grafite">
          Lançamentos, provas de alianças e os bastidores de cada entrega. Acompanhe por lá.
        </p>
      )}
      <div className="mt-10 text-center">
        <a
          href={MARCA.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 border border-tinta px-7 py-3 text-xs font-semibold tracking-[0.2em] text-tinta transition hover:bg-onix hover:text-ouro"
        >
          <IconeInstagram className="h-4 w-4" />
          SEGUIR NO INSTAGRAM
        </a>
      </div>
    </section>
  );
}

export default function Home() {
  const { data: lista, isLoading } = trpc.produtos.listar.useQuery();
  const { data: banners } = trpc.categorias.listarBanners.useQuery();

  const todos = lista ?? [];
  const baseDestaques = todos.some((p) => p.destaque) ? todos.filter((p) => p.destaque) : todos;
  // Grade de 4 colunas sem linha "órfã": 4 ou 8 peças (ou todas, se < 4)
  const destaques = baseDestaques.slice(0, baseDestaques.length >= 8 ? 8 : baseDestaques.length >= 4 ? 4 : baseDestaques.length);
  const novidades = todos.filter((p) => p.novidade).slice(0, 10);

  return (
    <div>
      <Seo
        titulo={`${MARCA.nome} | Joias e Alianças`}
        descricao="Anéis, brincos, colares, pulseiras e alianças com acabamento em ouro 18k e ródio. Garantia, embalagem para presente, envio para todo o Brasil e desconto no Pix."
        caminho="/"
      />
      <Header />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="fundo-onix relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:grid-cols-[1.15fr_1fr] md:py-24 lg:px-8">
          <div className="animate-surgir text-center md:text-left">
            <p className="eyebrow text-ouro">Joias e Alianças · por {MARCA.responsavel}</p>
            <h1 className="mt-6 font-display text-4xl leading-[1.12] text-marfim md:text-6xl">
              O brilho de <span className="texto-ouro">todo dia</span>, e o dos dias que ficam.
            </h1>
            <p className="mx-auto mt-6 max-w-md text-[0.95rem] leading-relaxed text-marfim/70 md:mx-0">
              Peças com banho de ouro 18k e ródio, zircônias bem cravadas e garantia de verdade.
              Escolhidas uma a uma para durar no seu dia a dia.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4 md:justify-start">
              <Link
                href="/catalogo/aneis"
                className="bg-ouro px-8 py-4 text-xs font-semibold tracking-[0.22em] text-onix transition hover:bg-ouro-claro"
              >
                VER COLEÇÃO
              </Link>
              <Link
                href="/catalogo/aliancas"
                className="border border-ouro/60 px-8 py-4 text-xs font-semibold tracking-[0.22em] text-ouro transition hover:border-ouro hover:bg-ouro/10"
              >
                ALIANÇAS
              </Link>
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[15rem] md:max-w-[26rem]">
            <div className="absolute inset-[8%] rounded-full bg-ouro/10 blur-3xl" />
            <div className="absolute inset-0 rounded-full border border-ouro/15" />
            <div className="absolute inset-[6%] rounded-full border border-dashed border-ouro/15 motion-safe:animate-[spin_80s_linear_infinite]" />
            <Monograma className="relative h-full w-full drop-shadow-[0_0_40px_rgba(212,175,55,0.35)]" />
          </div>
        </div>
      </section>

      {/* ── Benefícios ───────────────────────────────────────── */}
      <section className="border-b border-linha bg-white/50">
        <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-y-6 px-6 py-8 md:grid-cols-4 lg:px-8">
          {[
            { icone: IconeEscudo, titulo: "Garantia no banho", texto: "12 meses contra defeitos" },
            { icone: IconeDiamante, titulo: "Antialérgicas", texto: "Livres de níquel" },
            { icone: IconePresente, titulo: "Prontas para presentear", texto: "Estojo e sacola da marca" },
            {
              icone: IconePix,
              titulo: `${Math.round(DESCONTO_PIX * 100)}% off no Pix`,
              texto: `ou ${PARCELAS_MAX}x sem juros no cartão`,
            },
          ].map(({ icone: Icone, titulo, texto }) => (
            <li key={titulo} className="flex items-center gap-3 md:justify-center">
              <Icone className="h-7 w-7 flex-shrink-0 text-ouro-profundo" />
              <div>
                <p className="text-sm font-medium text-tinta">{titulo}</p>
                <p className="text-xs text-grafite">{texto}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Categorias ───────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <Titulo eyebrow="Coleções" titulo="Encontre a sua" />
        <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
          {CATEGORIAS.map((cat) => {
            const banner = banners?.[cat.valor];
            return (
              <Link
                key={cat.valor}
                href={`/catalogo/${cat.valor}`}
                className="group relative flex aspect-[4/5] items-end overflow-hidden bg-onix md:aspect-[5/4]"
              >
                {banner ? (
                  <img src={banner} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                ) : (
                  <div className="fundo-onix absolute inset-0 flex items-start justify-center pt-[14%]">
                    <Monograma className="h-1/3 w-1/3 opacity-25 transition duration-700 group-hover:opacity-50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-onix/85 via-onix/10 to-transparent" />
                <div className="absolute inset-3 border border-ouro/0 transition duration-500 group-hover:border-ouro/50" />
                <div className="relative w-full p-5 md:p-7">
                  <p className="font-display text-xl text-marfim md:text-2xl">{cat.label}</p>
                  <p className="mt-1 hidden text-xs text-marfim/70 md:block">{cat.descricao}</p>
                  <p className="eyebrow mt-3 text-[0.6rem] text-ouro transition group-hover:tracking-[0.36em]">Ver peças →</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Destaques ────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <Titulo eyebrow="As mais desejadas" titulo="Destaques" />
        <div className="mt-12">
          {isLoading ? <GradeEsqueleto /> : destaques.length > 0 ? <GradeProdutos produtos={destaques} /> : (
            <p className="text-center text-grafite">As primeiras peças estão sendo cadastradas.</p>
          )}
        </div>
      </section>

      {/* ── Faixa Alianças ───────────────────────────────────── */}
      <section className="relative overflow-hidden bg-safira">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 opacity-[0.05]">
          <Monograma variante="marfim" />
        </div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 md:grid-cols-2 lg:px-8">
          <div>
            <p className="eyebrow text-ouro">Namoro · Noivado · Casamento</p>
            <h2 className="mt-4 font-display text-3xl leading-tight text-marfim md:text-5xl">
              Alianças com o nome de vocês por dentro
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-marfim/70">
              Gravação de nomes e data, ajuda para acertar o aro de cada um e opções em ouro 18k
              maciço sob encomenda. A gente confere tudo com vocês antes de gravar.
            </p>
            <Link
              href="/catalogo/aliancas"
              className="mt-8 inline-block bg-ouro px-8 py-4 text-xs font-semibold tracking-[0.22em] text-onix transition hover:bg-ouro-claro"
            >
              ESCOLHER ALIANÇAS
            </Link>
          </div>
          <div className="relative">
            <img
              src="/marca/anel-estojo.jpg"
              alt="Anel solitário no estojo FS Joias"
              loading="lazy"
              className="w-full object-cover shadow-2xl ring-1 ring-ouro/30"
            />
          </div>
        </div>
      </section>

      {/* ── Novidades ────────────────────────────────────────── */}
      {novidades.length > 0 && (
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Titulo eyebrow="Acabou de chegar" titulo="Novidades" />
          </div>
          <div className="sem-scrollbar mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4 lg:px-[max(2rem,calc((100vw-80rem)/2+2rem))]">
            {novidades.map((p) => (
              <div key={p.id} className="w-[44vw] flex-shrink-0 snap-start sm:w-64">
                <ProdutoCard produto={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── A marca ──────────────────────────────────────────── */}
      <section className="border-y border-linha bg-white/60">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 lg:px-8">
          <img src="/marca/embalagem.jpg" alt="Sacola e estojo FS Joias" loading="lazy" className="w-full object-cover shadow-joia" />
          <div>
            <p className="eyebrow text-ouro-profundo">A marca</p>
            <h2 className="mt-4 font-display text-3xl leading-tight text-tinta md:text-4xl">
              Cada peça passa pela mão da {MARCA.responsavel.split(" ")[0]} antes de chegar na sua
            </h2>
            <p className="mt-5 leading-relaxed text-grafite">
              Curadoria de fornecedor, conferência de banho, cravação e fecho, embalagem caprichada
              e atendimento feito por gente, do primeiro direct até a joia chegar.
            </p>
            <Link href="/sobre" className="mt-8 inline-block border-b border-tinta pb-1 text-xs font-semibold tracking-[0.2em] text-tinta hover:border-ouro-profundo hover:text-ouro-profundo">
              CONHEÇA A FS JOIAS
            </Link>
          </div>
        </div>
      </section>

      <Instagram />

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 pb-8 pt-4">
        <Titulo eyebrow="Dúvidas" titulo="Perguntas frequentes" />
        <div className="mt-12">
          {FAQ.map((item) => (
            <details key={item.pergunta} className="group border-b border-linha py-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-medium text-tinta">
                {item.pergunta}
                <span className="text-xl text-ouro-profundo transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-grafite">{item.resposta}</p>
            </details>
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdSeguro([
            {
              "@context": "https://schema.org",
              "@type": "JewelryStore",
              name: MARCA.nome,
              url: MARCA.siteUrl,
              logo: `${MARCA.siteUrl}/icon-512.png`,
              sameAs: [MARCA.instagramUrl],
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: FAQ.map((item) => ({
                "@type": "Question",
                name: item.pergunta,
                acceptedAnswer: { "@type": "Answer", text: item.resposta },
              })),
            },
          ]),
        }}
      />

      <Footer />
    </div>
  );
}

const FAQ = [
  {
    pergunta: "As joias escurecem?",
    resposta:
      "Com os cuidados certos, o banho dura muito. Evite perfume, cremes, cloro, água do mar e academia, e guarde cada peça separada. Se o banho apresentar defeito dentro da garantia, a gente resolve.",
  },
  {
    pergunta: "Qual é a garantia?",
    resposta:
      "As peças com banho têm garantia de 12 meses contra defeitos no banho e de fabricação. O prazo de cada peça aparece na página do produto.",
  },
  {
    pergunta: "Como descubro o meu aro?",
    resposta:
      "Na página A marca tem o passo a passo para medir com um anel que você já usa ou com uma tira de papel. Na dúvida, chama a gente no atendimento antes de comprar.",
  },
  {
    pergunta: "Como funciona a gravação das alianças?",
    resposta:
      "Você escreve o texto na página da aliança (nomes, data, uma palavra). Antes de gravar, conferimos o texto com você. Peças gravadas não têm troca por arrependimento.",
  },
  {
    pergunta: "Qual o prazo de envio?",
    resposta:
      "Peças de pronta entrega saem em até 2 dias úteis após a confirmação do pagamento. Alianças gravadas ou sob encomenda têm o prazo informado na página. O frete e o prazo de entrega aparecem ao digitar o CEP.",
  },
  {
    pergunta: "Quais as formas de pagamento?",
    resposta: `Pix com ${Math.round(DESCONTO_PIX * 100)}% de desconto, boleto ou cartão de crédito em até ${PARCELAS_MAX}x sem juros.`,
  },
  {
    pergunta: "Posso trocar?",
    resposta:
      "Sim, em até 7 dias após o recebimento, com a peça sem uso e na embalagem original. Fale com a gente pelo Instagram ou e-mail que orientamos o envio.",
  },
];
