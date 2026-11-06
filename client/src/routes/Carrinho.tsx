import { Link, useLocation } from "wouter";
import { DESCONTO_PIX, formatarBRL, parcelamento } from "@shared/const";
import { useCarrinho } from "../lib/carrinho-context";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Seo from "../components/Seo";
import ItemSacola from "../components/ItemSacola";

export default function Carrinho() {
  const { itens, subtotal } = useCarrinho();
  const [, navegar] = useLocation();
  const parc = parcelamento(subtotal);

  return (
    <div>
      <Seo titulo="Sacola" descricao="Sua sacola na FS Joias." caminho="/carrinho" semIndexar />
      <Header />

      <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
        <h1 className="font-display text-3xl text-tinta">Sua sacola</h1>

        {itens.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-grafite">Sua sacola está vazia.</p>
            <Link href="/" className="mt-6 inline-block bg-onix px-7 py-3 text-xs font-semibold tracking-[0.2em] text-ouro">
              VER JOIAS
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_360px]">
            <div className="divide-y divide-linha border-y border-linha">
              {itens.map((item) => (
                <ItemSacola key={item.uid} item={item} />
              ))}
            </div>

            <aside className="h-fit bg-white p-7 shadow-joia">
              <p className="eyebrow text-grafite">Resumo</p>
              <div className="mt-5 flex justify-between text-sm">
                <span className="text-grafite">Subtotal</span>
                <span className="text-tinta">{formatarBRL(subtotal)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-grafite">Frete</span>
                <span className="text-grafite">calculado no checkout</span>
              </div>
              <div className="my-5 h-px bg-linha" />
              <p className="flex justify-between text-sm">
                <span className="text-tinta">No Pix</span>
                <span className="font-medium text-ouro-profundo">{formatarBRL(subtotal * (1 - DESCONTO_PIX))}</span>
              </p>
              {parc && (
                <p className="mt-1 text-right text-xs text-grafite">
                  ou {parc.vezes}x de {formatarBRL(parc.parcela)} sem juros
                </p>
              )}
              <button
                onClick={() => navegar("/checkout")}
                className="mt-7 w-full bg-onix py-4 text-xs font-semibold tracking-[0.22em] text-ouro transition hover:bg-safira"
              >
                FINALIZAR COMPRA
              </button>
              <Link href="/" className="mt-3 block text-center text-sm text-grafite hover:text-tinta">
                Continuar comprando
              </Link>
            </aside>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
