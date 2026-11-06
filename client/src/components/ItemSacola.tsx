import { Link } from "wouter";
import { formatarBRL } from "@shared/const";
import { precoUnitarioItem, useCarrinho } from "../lib/carrinho-context";
import type { ItemCarrinho } from "../lib/types";
import { SemFoto } from "./Monograma";

export default function ItemSacola({ item, compacto = false }: { item: ItemCarrinho; compacto?: boolean }) {
  const { removerItem, atualizarQuantidade } = useCarrinho();
  const unit = precoUnitarioItem(item);
  const detalhes = [item.varianteBanhoNome, item.varianteTamanhoNome].filter(Boolean).join(" · ");

  return (
    <div className="flex gap-4 py-5">
      <Link href={`/produto/${item.produto.slug}`} className={`${compacto ? "h-24 w-20" : "h-32 w-28"} flex-shrink-0 overflow-hidden bg-linha/40`}>
        {item.produto.imagens?.[0] ? (
          <img src={item.produto.imagens[0]} alt="" className="h-full w-full object-cover" />
        ) : (
          <SemFoto />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/produto/${item.produto.slug}`} className="font-display text-sm text-tinta hover:text-ouro-profundo">
              {item.produto.nome}
            </Link>
            {detalhes && <p className="mt-1 text-xs text-grafite">{detalhes}</p>}
            {item.personalizacao?.textoGravacao && (
              <p className="mt-1 text-xs text-ouro-profundo">Gravação: “{item.personalizacao.textoGravacao}”</p>
            )}
          </div>
          <p className="whitespace-nowrap text-sm text-tinta">{formatarBRL(unit * item.quantidade)}</p>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center border border-linha">
            <button
              onClick={() => atualizarQuantidade(item.uid, item.quantidade - 1)}
              disabled={item.quantidade <= 1}
              aria-label="Diminuir quantidade"
              className="h-8 w-8 text-grafite hover:text-tinta disabled:opacity-30"
            >
              −
            </button>
            <span className="w-8 text-center text-sm">{item.quantidade}</span>
            <button
              onClick={() => atualizarQuantidade(item.uid, item.quantidade + 1)}
              aria-label="Aumentar quantidade"
              className="h-8 w-8 text-grafite hover:text-tinta"
            >
              +
            </button>
          </div>
          <button onClick={() => removerItem(item.uid)} className="text-xs text-grafite underline-offset-4 hover:text-tinta hover:underline">
            Remover
          </button>
        </div>
      </div>
    </div>
  );
}
