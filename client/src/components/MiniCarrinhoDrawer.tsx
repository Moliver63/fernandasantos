import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { DESCONTO_PIX, formatarBRL } from "@shared/const";
import { useCarrinho } from "../lib/carrinho-context";
import ItemSacola from "./ItemSacola";
import { IconeFechar, IconeSacola } from "./Icones";

export default function MiniCarrinhoDrawer() {
  const { drawerAberto, fecharDrawer, itens, totalItens, subtotal } = useCarrinho();
  const [location, navegar] = useLocation();

  useEffect(() => {
    if (!drawerAberto) return;
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") fecharDrawer();
    }
    window.addEventListener("keydown", aoTeclar);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = "";
    };
  }, [drawerAberto, fecharDrawer]);

  // Fecha ao navegar
  useEffect(() => {
    fecharDrawer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  if (!drawerAberto) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button aria-label="Fechar" onClick={fecharDrawer} className="absolute inset-0 bg-onix/50 backdrop-blur-[2px]" />

      <aside
        role="dialog"
        aria-label="Sua sacola"
        className="relative flex h-full w-full max-w-md flex-col bg-marfim shadow-2xl animate-[entrar_0.28s_ease-out]"
      >
        <div className="flex items-center justify-between border-b border-linha px-6 py-5">
          <p className="font-display text-lg text-tinta">
            Sua sacola <span className="text-sm text-grafite">({totalItens})</span>
          </p>
          <button onClick={fecharDrawer} aria-label="Fechar" className="text-grafite hover:text-tinta">
            <IconeFechar className="h-6 w-6" />
          </button>
        </div>

        {itens.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <IconeSacola className="h-10 w-10 text-ouro-profundo" />
            <p className="mt-4 font-display text-lg text-tinta">Sua sacola está vazia</p>
            <p className="mt-2 text-sm text-grafite">Que tal começar pelos mais desejados?</p>
            <Link href="/catalogo/aneis" className="mt-6 bg-onix px-7 py-3 text-xs font-semibold tracking-[0.2em] text-ouro">
              VER JOIAS
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 divide-y divide-linha overflow-y-auto px-6">
              {itens.map((item) => (
                <ItemSacola key={item.uid} item={item} compacto />
              ))}
            </div>

            <div className="space-y-3 border-t border-linha bg-white/50 px-6 py-5">
              <div className="flex justify-between text-sm">
                <span className="text-grafite">Subtotal</span>
                <span className="font-medium text-tinta">{formatarBRL(subtotal)}</span>
              </div>
              <p className="text-xs text-ouro-profundo">
                No Pix: {formatarBRL(subtotal * (1 - DESCONTO_PIX))} ({Math.round(DESCONTO_PIX * 100)}% off). Frete calculado no checkout.
              </p>
              <button
                onClick={() => navegar("/checkout")}
                className="w-full bg-onix py-4 text-xs font-semibold tracking-[0.22em] text-ouro transition hover:bg-safira"
              >
                FINALIZAR COMPRA
              </button>
              <button onClick={fecharDrawer} className="w-full py-1 text-sm text-grafite hover:text-tinta">
                Continuar comprando
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
