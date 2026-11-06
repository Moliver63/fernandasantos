import { useParams, Link } from "wouter";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { VarianteBanho, VarianteTamanho } from "../lib/types";
import { useCarrinho } from "../lib/carrinho-context";
import { useFavoritos } from "../lib/favoritos";
import { trpc } from "../lib/trpc";
import { rastrear } from "../lib/rastreamento";
import { DESCONTO_PIX, formatarBRL, labelCategoria, precoEfetivo } from "@shared/const";
import { MARCA, linkAtendimento } from "@shared/marca";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CarrosselImagens from "../components/CarrosselImagens";
import ProdutoCard, { Preco } from "../components/ProdutoCard";
import Seo from "../components/Seo";
import { IconeCaminhao, IconeCoracao, IconeEscudo, IconePresente } from "../components/Icones";
import { jsonLdSeguro } from "../lib/jsonld";

function Sanfona({ titulo, children, aberta = false }: { titulo: string; children: ReactNode; aberta?: boolean }) {
  return (
    <details open={aberta} className="group border-b border-linha py-4 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium tracking-wide text-tinta">
        {titulo}
        <span className="text-lg text-grafite transition group-open:rotate-45">+</span>
      </summary>
      <div className="pt-3 text-sm leading-relaxed text-grafite">{children}</div>
    </details>
  );
}

function CalculoFrete() {
  const [cep, setCep] = useState("");
  const limpo = cep.replace(/\D/g, "");
  const { data, isFetching } = trpc.frete.calcular.useQuery({ cep: limpo }, { enabled: limpo.length === 8 });

  return (
    <div className="mt-6">
      <label className="text-xs font-medium tracking-wide text-tinta" htmlFor="cep-produto">
        Calcular frete e prazo
      </label>
      <div className="mt-2 flex items-center border-b border-linha focus-within:border-tinta">
        <input
          id="cep-produto"
          inputMode="numeric"
          maxLength={9}
          placeholder="Digite seu CEP"
          value={cep}
          onChange={(e) => setCep(e.target.value.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2"))}
          className="flex-1 bg-transparent py-2 text-sm focus:outline-none"
        />
        <a
          href="https://buscacepinter.correios.com.br/app/endereco/index.php"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-grafite underline-offset-4 hover:underline"
        >
          Não sei meu CEP
        </a>
      </div>
      {limpo.length === 8 && (
        <p className="mt-2 text-sm text-grafite">
          {isFetching
            ? "Calculando…"
            : data?.encontrado
            ? <>Entrega para {data.regiao}: <strong className="text-tinta">{formatarBRL(data.valor)}</strong>, em até {data.prazoDias} dias úteis após o envio.</>
            : data?.mensagem}
        </p>
      )}
    </div>
  );
}

export default function ProdutoDetalhe() {
  const { slug } = useParams();
  const { adicionarItem } = useCarrinho();
  const { ehFavorito, alternar } = useFavoritos();

  const { data: produto, isError } = trpc.produtos.buscarPorSlug.useQuery({ slug: slug ?? "" }, { enabled: !!slug });
  const { data: catalogo = [] } = trpc.produtos.listar.useQuery(undefined, { enabled: !!produto });

  const [tamanho, setTamanho] = useState<VarianteTamanho | null>(null);
  const [banho, setBanho] = useState<VarianteBanho | null>(null);
  const [querGravacao, setQuerGravacao] = useState(false);
  const [textoGravacao, setTextoGravacao] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [avisoTamanho, setAvisoTamanho] = useState(false);

  useEffect(() => {
    if (!produto) return;
    setBanho(produto.variantesBanho.find((b) => b.estoqueDisponivel) ?? null);
    // Tamanho só vem pré-selecionado quando existe um único — aro errado
    // é a troca mais comum em anel, então a cliente precisa escolher.
    setTamanho(produto.variantesTamanho.length === 1 ? produto.variantesTamanho[0] : null);
    setQuerGravacao(false);
    setTextoGravacao("");
    setQuantidade(1);
    rastrear("ViewContent", {
      content_ids: [String(produto.id)],
      content_name: produto.nome,
      content_type: "product",
      value: precoEfetivo(produto),
      currency: "BRL",
    });
  }, [produto]);

  const imagensExibidas = useMemo(() => {
    if (!produto) return [];
    const imagemVariante = banho?.imagemUrl || tamanho?.imagemUrl;
    if (!imagemVariante) return produto.imagens ?? [];
    return [imagemVariante, ...(produto.imagens ?? []).filter((u) => u !== imagemVariante)];
  }, [produto, banho, tamanho]);

  // Mesma categoria primeiro, completa com o resto do catálogo até 4
  const relacionados = [
    ...catalogo.filter((p) => p.id !== produto?.id && p.categoria === produto?.categoria),
    ...catalogo.filter((p) => p.id !== produto?.id && p.categoria !== produto?.categoria),
  ].slice(0, 4);

  if (isError)
    return (
      <div>
        <Header />
        <div className="mx-auto max-w-xl px-6 py-24 text-center">
          <h1 className="font-display text-2xl text-tinta">Peça não encontrada</h1>
          <p className="mt-3 text-grafite">Ela pode ter saído de coleção. Veja as outras joias.</p>
          <Link href="/" className="mt-6 inline-block bg-onix px-7 py-3 text-xs font-semibold tracking-[0.2em] text-ouro">
            VOLTAR À LOJA
          </Link>
        </div>
        <Footer />
      </div>
    );

  if (!produto)
    return (
      <div>
        <Header />
        <div className="mx-auto grid max-w-7xl animate-pulse gap-12 px-6 py-12 md:grid-cols-2 lg:px-8">
          <div className="aspect-[4/5] bg-linha/50" />
          <div className="space-y-4 pt-6">
            <div className="h-3 w-24 bg-linha/60" />
            <div className="h-8 w-3/4 bg-linha/60" />
            <div className="h-6 w-32 bg-linha/60" />
          </div>
        </div>
        <Footer />
      </div>
    );

  const precoUnit = precoEfetivo(produto) + (querGravacao && textoGravacao.trim() ? Number(produto.custoPersonalizacao ?? 0) : 0);
  const esgotado = produto.controlarEstoque && produto.estoque === 0;
  const favorito = ehFavorito(produto.id);
  const ehAnel = produto.categoria === "aneis" || produto.categoria === "aliancas";

  function adicionar() {
    if (!produto) return;
    if (produto.variantesTamanho.length > 1 && !tamanho) {
      setAvisoTamanho(true);
      document.getElementById("seletor-tamanho")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    adicionarItem({
      produtoId: produto.id,
      produto: {
        id: produto.id,
        nome: produto.nome,
        slug: produto.slug,
        categoria: produto.categoria,
        precoBase: produto.precoBase,
        precoPromocional: produto.precoPromocional,
        personalizavel: produto.personalizavel,
        custoPersonalizacao: produto.custoPersonalizacao,
        imagens: produto.imagens,
      },
      varianteBanhoId: banho?.id ?? null,
      varianteBanhoNome: banho?.nome ?? null,
      varianteTamanhoId: tamanho?.id ?? null,
      varianteTamanhoNome: tamanho?.nome ?? null,
      quantidade,
      personalizacao:
        produto.personalizavel && querGravacao && textoGravacao.trim()
          ? { textoGravacao: textoGravacao.trim() }
          : undefined,
    });
  }

  const ficha: [string, string | null | undefined][] = [
    ["Material", produto.material],
    ["Pedras", produto.pedras],
    ["Medidas", produto.dimensoes],
    ["Antialérgica", produto.hipoalergenica ? "Sim, livre de níquel" : null],
    ["Garantia", produto.garantiaMeses > 0 ? `${produto.garantiaMeses} meses no banho` : null],
  ];

  const BotaoComprar = ({ className = "" }: { className?: string }) =>
    produto.precoSobConsulta ? (
      <a
        href={linkAtendimento(`Olá! Quero saber o valor de: ${produto.nome}`)}
        target="_blank"
        rel="noopener noreferrer"
        className={`block bg-onix py-4 text-center text-xs font-semibold tracking-[0.22em] text-ouro transition hover:bg-safira ${className}`}
      >
        CONSULTAR VALOR
      </a>
    ) : esgotado ? (
      <a
        href={linkAtendimento(`Olá! Quero ser avisada quando voltar: ${produto.nome}`)}
        target="_blank"
        rel="noopener noreferrer"
        className={`block border border-tinta py-4 text-center text-xs font-semibold tracking-[0.22em] text-tinta ${className}`}
      >
        ESGOTADO · AVISE-ME
      </a>
    ) : (
      <button
        onClick={adicionar}
        className={`w-full bg-onix py-4 text-xs font-semibold tracking-[0.22em] text-ouro transition hover:bg-safira ${className}`}
      >
        ADICIONAR À SACOLA · {formatarBRL(precoUnit * quantidade)}
      </button>
    );

  return (
    <div className="pb-24 md:pb-0">
      <Seo
        titulo={produto.nome}
        descricao={produto.descricao ?? `${produto.nome} · ${labelCategoria(produto.categoria)} ${MARCA.nome}.`}
        caminho={`/produto/${produto.slug}`}
        imagem={produto.imagens?.[0]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdSeguro({
            "@context": "https://schema.org",
            "@type": "Product",
            name: produto.nome,
            description: produto.descricao ?? undefined,
            image: produto.imagens && produto.imagens.length > 0 ? produto.imagens : undefined,
            material: produto.material ?? undefined,
            category: labelCategoria(produto.categoria),
            brand: { "@type": "Brand", name: MARCA.nome },
            ...(!produto.precoSobConsulta && {
              offers: {
                "@type": "Offer",
                url: `${MARCA.siteUrl}/produto/${produto.slug}`,
                priceCurrency: "BRL",
                price: precoEfetivo(produto).toFixed(2),
                availability: esgotado ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
              },
            }),
          }),
        }}
      />
      <Header />

      <div className="mx-auto max-w-7xl px-6 pt-6 lg:px-8">
        <nav className="eyebrow flex flex-wrap items-center gap-2 text-[0.6rem] text-grafite">
          <Link href="/" className="hover:text-ouro-profundo">Início</Link>
          <span>/</span>
          <Link href={`/catalogo/${produto.categoria}`} className="hover:text-ouro-profundo">
            {labelCategoria(produto.categoria)}
          </Link>
          <span>/</span>
          <span className="text-tinta">{produto.nome}</span>
        </nav>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-8 md:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-8">
        <div className="md:sticky md:top-24 md:self-start">
          <CarrosselImagens imagens={imagensExibidas} nomeProduto={produto.nome} />
        </div>

        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-ouro-profundo">{labelCategoria(produto.categoria)}</p>
              <h1 className="mt-2 font-display text-3xl leading-tight text-tinta lg:text-4xl">{produto.nome}</h1>
            </div>
            <button
              onClick={() => alternar(produto.id)}
              aria-label={favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              aria-pressed={favorito}
              className={`mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-linha transition hover:border-tinta ${
                favorito ? "text-ouro-profundo" : "text-tinta"
              }`}
            >
              <IconeCoracao className="h-5 w-5" cheio={favorito} />
            </button>
          </div>

          <div className="mt-5">
            <Preco produto={produto} grande />
            {!produto.precoSobConsulta && (
              <p className="mt-2 inline-block bg-ouro/15 px-2.5 py-1 text-xs font-medium text-ouro-profundo">
                {formatarBRL(precoEfetivo(produto) * (1 - DESCONTO_PIX))} no Pix ({Math.round(DESCONTO_PIX * 100)}% off)
              </p>
            )}
          </div>

          {produto.descricao && <p className="mt-6 leading-relaxed text-grafite">{produto.descricao}</p>}

          {produto.variantesBanho.length > 0 && (
            <div className="mt-8">
              <p className="text-xs font-medium tracking-wide text-tinta">
                Banho: <span className="font-normal text-grafite">{banho?.nome ?? "escolha"}</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {produto.variantesBanho.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBanho(b)}
                    disabled={!b.estoqueDisponivel}
                    title={b.estoqueDisponivel ? b.nome : `${b.nome} (indisponível)`}
                    aria-label={b.nome}
                    aria-pressed={banho?.id === b.id}
                    className={`relative h-10 w-10 rounded-full p-0.5 ring-1 transition disabled:opacity-30 ${
                      banho?.id === b.id ? "ring-2 ring-tinta" : "ring-linha hover:ring-tinta/50"
                    }`}
                  >
                    <span className="block h-full w-full rounded-full" style={{ background: `radial-gradient(circle at 30% 30%, #fff8, transparent 55%), ${b.codigoHex ?? "#ccc"}` }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {produto.variantesTamanho.length > 0 && (
            <div className="mt-8" id="seletor-tamanho">
              <div className="flex items-center justify-between">
                <p className={`text-xs font-medium tracking-wide ${avisoTamanho && !tamanho ? "text-red-600" : "text-tinta"}`}>
                  {ehAnel ? "Aro" : "Tamanho"}: <span className="font-normal">{tamanho?.nome ?? "escolha uma opção"}</span>
                </p>
                {ehAnel && (
                  <Link href="/sobre#medidas" className="text-xs text-grafite underline underline-offset-4 hover:text-tinta">
                    Como medir o aro
                  </Link>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {produto.variantesTamanho.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTamanho(t);
                      setAvisoTamanho(false);
                    }}
                    disabled={!t.estoqueDisponivel}
                    className={`min-w-[3.5rem] border px-3 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-30 disabled:line-through ${
                      tamanho?.id === t.id ? "border-onix bg-onix text-ouro" : "border-linha text-tinta hover:border-tinta"
                    }`}
                  >
                    {t.nome.replace(/^Aro\s*/i, "")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {produto.personalizavel && (
            <div className="mt-8 border border-linha bg-white/60 p-5">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={querGravacao}
                  onChange={(e) => setQuerGravacao(e.target.checked)}
                  className="h-4 w-4 accent-[#0B0D14]"
                />
                <span className="text-sm font-medium text-tinta">
                  Quero gravação personalizada
                  {Number(produto.custoPersonalizacao ?? 0) > 0
                    ? ` (+${formatarBRL(Number(produto.custoPersonalizacao))})`
                    : " (cortesia)"}
                </span>
              </label>
              {querGravacao && (
                <div className="mt-4">
                  <input
                    type="text"
                    maxLength={30}
                    placeholder="Ex: Ana & Leo 12.06.2026"
                    value={textoGravacao}
                    onChange={(e) => setTextoGravacao(e.target.value)}
                    className="w-full border-b border-linha bg-transparent py-2 font-display text-lg tracking-wide text-tinta placeholder:font-sans placeholder:text-sm placeholder:text-grafite/50 focus:border-tinta focus:outline-none"
                  />
                  <p className="mt-2 text-xs text-grafite">
                    {30 - textoGravacao.length} caracteres restantes. Conferimos o texto com você antes de gravar.
                  </p>
                </div>
              )}
            </div>
          )}

          {produto.controlarEstoque && produto.estoque > 0 && produto.estoque <= 3 && (
            <p className="mt-6 text-sm text-ouro-profundo">◆ Restam só {produto.estoque} unidades</p>
          )}

          <div className="mt-8 flex gap-3">
            {!produto.precoSobConsulta && !esgotado && (
              <div className="flex items-center border border-linha">
                <button onClick={() => setQuantidade((q) => Math.max(1, q - 1))} className="h-full w-10 text-grafite" aria-label="Diminuir">−</button>
                <span className="w-8 text-center text-sm">{quantidade}</span>
                <button onClick={() => setQuantidade((q) => Math.min(produto.controlarEstoque ? produto.estoque : 20, q + 1))} className="h-full w-10 text-grafite" aria-label="Aumentar">+</button>
              </div>
            )}
            <div className="flex-1">
              <BotaoComprar />
            </div>
          </div>

          <ul className="mt-8 grid grid-cols-3 gap-3 border-y border-linha py-5 text-center text-[0.7rem] leading-tight text-grafite">
            <li className="flex flex-col items-center gap-2">
              <IconeEscudo className="h-6 w-6 text-ouro-profundo" />
              {produto.garantiaMeses > 0 ? `Garantia de ${produto.garantiaMeses} meses` : "Procedência garantida"}
            </li>
            <li className="flex flex-col items-center gap-2">
              <IconePresente className="h-6 w-6 text-ouro-profundo" />
              Embalagem para presente
            </li>
            <li className="flex flex-col items-center gap-2">
              <IconeCaminhao className="h-6 w-6 text-ouro-profundo" />
              Envio em até {produto.prazoProducaoDias} dia{produto.prazoProducaoDias > 1 ? "s" : ""} útil{produto.prazoProducaoDias > 1 ? "eis" : ""}
            </li>
          </ul>

          {!produto.precoSobConsulta && <CalculoFrete />}

          <div className="mt-8">
            {ficha.some(([, v]) => v) && (
              <Sanfona titulo="Detalhes da peça" aberta>
                <dl className="grid grid-cols-[110px_1fr] gap-y-2">
                  {ficha
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k} className="contents">
                        <dt className="text-grafite/80">{k}</dt>
                        <dd className="text-tinta">{v}</dd>
                      </div>
                    ))}
                </dl>
              </Sanfona>
            )}
            {produto.cuidados && <Sanfona titulo="Cuidados para o brilho durar">{produto.cuidados}</Sanfona>}
            <Sanfona titulo="Trocas e garantia">
              Você tem 7 dias após o recebimento para trocar ou devolver, com a peça sem uso e na embalagem.
              Peças com gravação são feitas para você e não têm troca por arrependimento.
              {produto.garantiaMeses > 0 && ` A garantia de ${produto.garantiaMeses} meses cobre o banho e defeitos de fabricação.`}{" "}
              <Link href="/sobre#garantia" className="text-ouro-profundo underline underline-offset-4">Ver política completa</Link>
            </Sanfona>
          </div>
        </div>
      </div>

      {relacionados.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="filete mb-10 font-display text-sm tracking-[0.3em]">
            <span className="text-tinta">COMBINA COM</span>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4 lg:gap-x-8">
            {relacionados.map((p) => (
              <ProdutoCard key={p.id} produto={p} />
            ))}
          </div>
        </section>
      )}

      {/* Barra fixa de compra no celular */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-4 border-t border-linha bg-marfim/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="min-w-0">
          <p className="truncate text-xs text-grafite">{produto.nome}</p>
          <p className="text-sm font-medium text-tinta">
            {produto.precoSobConsulta ? "Sob consulta" : formatarBRL(precoUnit)}
          </p>
        </div>
        <div className="flex-1">
          <BotaoComprar className="py-3.5" />
        </div>
      </div>

      <Footer />
    </div>
  );
}
