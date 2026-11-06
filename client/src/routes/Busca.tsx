import { useSearch } from "wouter";
import { useEffect } from "react";
import { trpc } from "../lib/trpc";
import { rastrear } from "../lib/rastreamento";
import Header from "../components/Header";
import Footer from "../components/Footer";
import GradeProdutos, { GradeEsqueleto } from "../components/GradeProdutos";
import Seo from "../components/Seo";

export default function Busca() {
  const params = new URLSearchParams(useSearch());
  const termo = (params.get("q") ?? "").trim();
  const { data = [], isLoading } = trpc.produtos.buscar.useQuery({ termo }, { enabled: termo.length >= 2 });

  useEffect(() => {
    if (termo.length >= 2) rastrear("Search", { search_string: termo });
  }, [termo]);

  return (
    <div>
      <Seo titulo={`Busca: ${termo}`} descricao="Resultados da busca na FS Joias." caminho="/busca" semIndexar />
      <Header />
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <p className="eyebrow text-ouro-profundo">Busca</p>
        <h1 className="mt-2 font-display text-3xl text-tinta">“{termo}”</h1>
        <p className="mt-2 text-sm text-grafite">
          {isLoading ? "Procurando…" : `${data.length} ${data.length === 1 ? "resultado" : "resultados"}`}
        </p>
        <div className="mt-10">
          {isLoading && termo.length >= 2 ? (
            <GradeEsqueleto n={4} />
          ) : data.length > 0 ? (
            <GradeProdutos produtos={data} />
          ) : (
            <p className="py-10 text-grafite">Nada encontrado. Tente “anel”, “riviera”, “ródio” ou “aliança”.</p>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
