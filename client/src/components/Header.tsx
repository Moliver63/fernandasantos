import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useCarrinho } from "../lib/carrinho-context";
import { useFavoritos } from "../lib/favoritos";
import { CATEGORIAS, DESCONTO_PIX, PARCELAS_MAX } from "@shared/const";
import Monograma, { Wordmark } from "./Monograma";
import { IconeBusca, IconeCadeado, IconeCoracao, IconeSacola } from "./Icones";

const links = [
  ...CATEGORIAS.map((c) => ({ href: `/catalogo/${c.valor}`, label: c.label })),
  { href: "/sobre", label: "A marca" },
];

function Contador({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span className="absolute -right-2 -top-1.5 flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full bg-ouro px-1 text-[0.65rem] font-semibold text-onix">
      {n}
    </span>
  );
}

export default function Header() {
  const { totalItens, abrirDrawer } = useCarrinho();
  const { ids: favoritos } = useFavoritos();
  const [menuAberto, setMenuAberto] = useState(false);
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [termo, setTermo] = useState("");
  const [location, navegar] = useLocation();

  useEffect(() => {
    setMenuAberto(false);
    setBuscaAberta(false);
  }, [location]);

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    if (termo.trim().length >= 2) navegar(`/busca?q=${encodeURIComponent(termo.trim())}`);
  }

  return (
    <>
      {/* Faixa de benefícios */}
      <div className="bg-onix px-4 py-2 text-center text-[0.68rem] font-medium tracking-[0.18em] text-ouro/90">
        ENVIO PARA TODO O BRASIL <span className="mx-2 text-ouro/40">◆</span>
        {Math.round(DESCONTO_PIX * 100)}% OFF NO PIX
        <span className="mx-2 hidden text-ouro/40 sm:inline">◆</span>
        <span className="hidden sm:inline">ATÉ {PARCELAS_MAX}X SEM JUROS</span>
      </div>

      <header className="sticky top-0 z-40 border-b border-linha bg-marfim/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 lg:px-8">
          <button
            onClick={() => setMenuAberto((v) => !v)}
            aria-label="Abrir menu"
            aria-expanded={menuAberto}
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 lg:hidden"
          >
            <span className={`h-px w-6 bg-tinta transition ${menuAberto ? "translate-y-[3.5px] rotate-45" : ""}`} />
            <span className={`h-px w-6 bg-tinta transition ${menuAberto ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
          </button>

          <Link href="/" className="flex flex-shrink-0 items-center gap-3" aria-label="FS Joias, página inicial">
            <Monograma className="h-10 w-10" />
            <Wordmark />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`eyebrow whitespace-nowrap transition hover:text-ouro-profundo ${
                  location === l.href ? "text-ouro-profundo" : "text-tinta/80"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4 text-tinta sm:gap-5">
            <button onClick={() => setBuscaAberta((v) => !v)} aria-label="Buscar" className="hover:text-ouro-profundo">
              <IconeBusca className="h-[1.35rem] w-[1.35rem]" />
            </button>
            <Link href="/favoritos" className="relative hidden hover:text-ouro-profundo sm:block" aria-label="Favoritos">
              <IconeCoracao className="h-[1.35rem] w-[1.35rem]" />
              <Contador n={favoritos.length} />
            </Link>
            <button
              onClick={abrirDrawer}
              className="relative hover:text-ouro-profundo"
              aria-label={`Sacola, ${totalItens} ${totalItens === 1 ? "item" : "itens"}`}
            >
              <IconeSacola className="h-[1.4rem] w-[1.4rem]" />
              <Contador n={totalItens} />
            </button>
            <Link
              href="/admin/produtos"
              className="hidden border-l border-linha pl-4 text-tinta/30 hover:text-tinta lg:block"
              aria-label="Acesso administrativo"
              title="Acesso administrativo"
            >
              <IconeCadeado className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {buscaAberta && (
          <form onSubmit={buscar} className="border-t border-linha bg-marfim px-5 py-4">
            <div className="mx-auto flex max-w-2xl items-center gap-3 border-b border-tinta/30 pb-2">
              <IconeBusca className="h-5 w-5 text-grafite" />
              <input
                autoFocus
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Buscar anel, brinco, riviera, ródio…"
                className="flex-1 bg-transparent text-base text-tinta placeholder:text-grafite/60 focus:outline-none"
              />
              <button type="submit" className="eyebrow text-ouro-profundo">
                Buscar
              </button>
            </div>
          </form>
        )}

        {menuAberto && (
          <nav className="flex flex-col border-t border-linha bg-marfim px-6 pb-6 pt-2 lg:hidden">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="border-b border-linha/60 py-3.5 font-display text-lg text-tinta">
                {l.label}
              </Link>
            ))}
            <Link href="/favoritos" className="border-b border-linha/60 py-3.5 font-display text-lg text-tinta">
              Favoritos {favoritos.length > 0 && `(${favoritos.length})`}
            </Link>
            <Link href="/rastreio" className="py-3.5 text-sm text-grafite">
              Rastrear pedido
            </Link>
            <Link href="/admin/produtos" className="mt-2 flex items-center gap-2 text-xs text-grafite/60">
              <IconeCadeado className="h-3.5 w-3.5" />
              Acesso administrativo
            </Link>
          </nav>
        )}
      </header>
    </>
  );
}
