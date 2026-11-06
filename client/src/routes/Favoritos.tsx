import { Link } from "wouter";
import { trpc } from "../lib/trpc";
import { useFavoritos } from "../lib/favoritos";
import Header from "../components/Header";
import Footer from "../components/Footer";
import GradeProdutos from "../components/GradeProdutos";
import Seo from "../components/Seo";

export default function Favoritos() {
  const { ids } = useFavoritos();
  const { data = [] } = trpc.produtos.listar.useQuery();
  const lista = data.filter((p) => ids.includes(p.id));

  return (
    <div>
      <Seo titulo="Meus favoritos" descricao="Suas joias favoritas na FS Joias." caminho="/favoritos" semIndexar />
      <Header />
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <p className="eyebrow text-ouro-profundo">Lista de desejos</p>
        <h1 className="mt-2 font-display text-3xl text-tinta">Meus favoritos</h1>
        {lista.length === 0 ? (
          <div className="py-16">
            <p className="text-grafite">
              Toque no coração das peças que você amou e elas ficam guardadas aqui, neste aparelho.
            </p>
            <Link href="/catalogo/aneis" className="mt-6 inline-block bg-onix px-7 py-3 text-xs font-semibold tracking-[0.2em] text-ouro">
              EXPLORAR JOIAS
            </Link>
          </div>
        ) : (
          <div className="mt-10">
            <GradeProdutos produtos={lista} />
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}
