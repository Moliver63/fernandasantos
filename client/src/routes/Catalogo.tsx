import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "../lib/trpc";
import { CATEGORIAS, labelCategoria, precoEfetivo, type Categoria } from "@shared/const";
import Header from "../components/Header";
import Footer from "../components/Footer";
import GradeProdutos, { GradeEsqueleto } from "../components/GradeProdutos";
import Seo from "../components/Seo";

type Ordenacao = "relevancia" | "novidades" | "menor-preco" | "maior-preco";

export default function Catalogo() {
  const { categoria } = useParams<{ categoria: Categoria }>();
  const { data: produtos = [], isLoading: carregando } = trpc.produtos.listar.useQuery({ categoria });
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("relevancia");
  const [banho, setBanho] = useState<string | null>(null);

  useEffect(() => setBanho(null), [categoria]);

  const info = CATEGORIAS.find((c) => c.valor === categoria);
  const titulo = labelCategoria(categoria ?? "");

  // Banhos presentes nesta categoria (vira filtro só se houver mais de um)
  const banhos = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const p of produtos) for (const b of p.variantesBanho) mapa.set(b.nome, b.codigoHex ?? "#ccc");
    return [...mapa.entries()];
  }, [produtos]);

  const lista = useMemo(() => {
    let l = banho ? produtos.filter((p) => p.variantesBanho.some((b) => b.nome === banho)) : [...produtos];
    const preco = (p: (typeof l)[number]) => (p.precoSobConsulta ? Infinity : precoEfetivo(p));
    switch (ordenacao) {
      case "menor-preco":
        l = l.sort((a, b) => preco(a) - preco(b));
        break;
      case "maior-preco":
        l = l.sort((a, b) => (b.precoSobConsulta ? -1 : preco(b)) - (a.precoSobConsulta ? -1 : preco(a)));
        break;
      case "novidades":
        l = l.sort((a, b) => Number(b.novidade) - Number(a.novidade) || +new Date(b.criadoEm) - +new Date(a.criadoEm));
        break;
    }
    return l;
  }, [produtos, ordenacao, banho]);

  return (
    <div>
      <Seo
        titulo={`${titulo} com banho de ouro 18k e ródio`}
        descricao={`${titulo} da FS Joias: ${info?.descricao ?? ""} Garantia, envio para todo o Brasil e desconto no Pix.`}
        caminho={`/catalogo/${categoria}`}
      />
      <Header />

      <section className="fundo-onix">
        <div className="mx-auto max-w-7xl px-6 py-14 text-center lg:px-8">
          <nav className="eyebrow mb-5 text-[0.6rem] text-marfim/50">
            <Link href="/" className="hover:text-ouro">Início</Link>
            <span className="mx-2">/</span>
            <span className="text-ouro">{titulo}</span>
          </nav>
          <h1 className="font-display text-4xl text-marfim md:text-5xl">{titulo}</h1>
          {info && <p className="mx-auto mt-4 max-w-lg text-sm text-marfim/70">{info.descricao}</p>}
        </div>
      </section>

      {/* Navegação entre categorias */}
      <div className="border-b border-linha">
        <div className="sem-scrollbar mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 py-4 lg:justify-center lg:px-8">
          {CATEGORIAS.map((c) => (
            <Link
              key={c.valor}
              href={`/catalogo/${c.valor}`}
              className={`whitespace-nowrap border px-4 py-2 text-xs font-medium tracking-[0.12em] transition ${
                c.valor === categoria
                  ? "border-onix bg-onix text-ouro"
                  : "border-linha text-tinta hover:border-tinta"
              }`}
            >
              {c.label.toUpperCase()}
            </Link>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        {!carregando && produtos.length > 0 && (
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-grafite">{lista.length} {lista.length === 1 ? "peça" : "peças"}</span>
              {banhos.length > 1 && (
                <>
                  <span className="mx-2 h-4 w-px bg-linha" />
                  {banhos.map(([nome, hex]) => (
                    <button
                      key={nome}
                      onClick={() => setBanho(banho === nome ? null : nome)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
                        banho === nome ? "border-tinta bg-white text-tinta" : "border-linha text-grafite hover:border-tinta"
                      }`}
                    >
                      <span className="h-3 w-3 rounded-full ring-1 ring-tinta/15" style={{ backgroundColor: hex }} />
                      {nome}
                    </button>
                  ))}
                </>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm text-grafite">
              Ordenar
              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}
                className="border-b border-linha bg-transparent py-1.5 pr-6 text-tinta focus:border-tinta focus:outline-none"
              >
                <option value="relevancia">Em destaque</option>
                <option value="novidades">Novidades</option>
                <option value="menor-preco">Menor preço</option>
                <option value="maior-preco">Maior preço</option>
              </select>
            </label>
          </div>
        )}

        {carregando && <GradeEsqueleto />}

        {!carregando && produtos.length === 0 && (
          <div className="py-20 text-center">
            <p className="font-display text-xl text-tinta">Novas peças chegando</p>
            <p className="mt-2 text-sm text-grafite">
              Esta coleção está sendo preparada. Enquanto isso, acompanhe os lançamentos no Instagram.
            </p>
          </div>
        )}

        {!carregando && <GradeProdutos produtos={lista} />}
      </section>

      <Footer />
    </div>
  );
}
