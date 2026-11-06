import { Link } from "wouter";
import type { Produto } from "../lib/types";
import { formatarBRL, labelCategoria, parcelamento, precoEfetivo } from "@shared/const";
import { useFavoritos } from "../lib/favoritos";
import { SemFoto } from "./Monograma";
import { IconeCoracao } from "./Icones";

export function Preco({ produto, grande = false }: { produto: Produto; grande?: boolean }) {
  if (produto.precoSobConsulta) {
    return <p className={`${grande ? "text-xl" : "text-sm"} font-medium text-ouro-profundo`}>Sob consulta</p>;
  }
  const base = Number(produto.precoBase);
  const final = precoEfetivo(produto);
  const emPromo = final < base;
  const parc = parcelamento(final);
  return (
    <div>
      <p className={grande ? "flex items-baseline gap-3" : "flex items-baseline gap-2"}>
        {emPromo && (
          <span className={`${grande ? "text-base" : "text-xs"} text-grafite line-through`}>{formatarBRL(base)}</span>
        )}
        <span className={`${grande ? "text-3xl" : "text-[0.95rem]"} font-medium text-tinta`}>{formatarBRL(final)}</span>
      </p>
      {parc && (
        <p className={`${grande ? "mt-1 text-sm" : "text-xs"} text-grafite`}>
          ou {parc.vezes}x de {formatarBRL(parc.parcela)} sem juros
        </p>
      )}
    </div>
  );
}

export default function ProdutoCard({ produto }: { produto: Produto }) {
  const { ehFavorito, alternar } = useFavoritos();
  const favorito = ehFavorito(produto.id);
  const final = precoEfetivo(produto);
  const desconto = !produto.precoSobConsulta && final < Number(produto.precoBase)
    ? Math.round((1 - final / Number(produto.precoBase)) * 100)
    : 0;
  const esgotado = produto.controlarEstoque && produto.estoque === 0;
  const segundaFoto = produto.imagens?.[1];

  return (
    <div className="group relative">
      <Link href={`/produto/${produto.slug}`} className="block">
        <div className="reflexo relative aspect-[4/5] overflow-hidden bg-linha/40">
          {produto.imagens?.[0] ? (
            <>
              <img
                src={produto.imagens[0]}
                alt={produto.nome}
                loading="lazy"
                className={`h-full w-full object-cover transition duration-700 group-hover:scale-[1.04] ${
                  segundaFoto ? "group-hover:opacity-0" : ""
                }`}
              />
              {segundaFoto && (
                <img
                  src={segundaFoto}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-700 group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <SemFoto className="transition duration-700 group-hover:scale-[1.04]" />
          )}

          <div className="absolute left-2 top-2 flex max-w-[calc(100%-3.5rem)] flex-col items-start gap-1.5 sm:left-3 sm:top-3">
            {desconto > 0 && (
              <span className="bg-onix px-2 py-1 text-[0.55rem] font-semibold tracking-[0.14em] sm:px-2.5 sm:text-[0.6rem] sm:tracking-[0.18em] text-ouro">
                −{desconto}%
              </span>
            )}
            {produto.novidade && (
              <span className="bg-marfim px-2 py-1 text-[0.55rem] font-semibold tracking-[0.14em] sm:px-2.5 sm:text-[0.6rem] sm:tracking-[0.18em] text-tinta">
                NOVIDADE
              </span>
            )}
            {produto.personalizavel && (
              <span className="bg-safira px-2 py-1 text-[0.55rem] font-semibold tracking-[0.14em] sm:px-2.5 sm:text-[0.6rem] sm:tracking-[0.18em] text-marfim">
                COM GRAVAÇÃO
              </span>
            )}
          </div>

          {esgotado && (
            <div className="absolute inset-x-0 bottom-0 bg-onix/80 py-2 text-center text-[0.65rem] font-semibold tracking-[0.2em] text-marfim">
              ESGOTADO
            </div>
          )}
          {!esgotado && produto.controlarEstoque && produto.estoque > 0 && produto.estoque <= 3 && (
            <div className="absolute inset-x-0 bottom-0 bg-ouro/90 py-2 text-center text-[0.65rem] font-semibold tracking-[0.2em] text-onix">
              ÚLTIMAS {produto.estoque} UNIDADES
            </div>
          )}
        </div>

        <div className="mt-4">
          <p className="eyebrow text-[0.6rem] text-grafite">{labelCategoria(produto.categoria)}</p>
          <h3 className="mt-1 font-display text-[0.95rem] leading-snug text-tinta">{produto.nome}</h3>
          {produto.variantesBanho.length > 1 && (
            <div className="mt-2 flex gap-1.5" aria-label="Banhos disponíveis">
              {produto.variantesBanho.slice(0, 5).map((b) => (
                <span
                  key={b.id}
                  title={b.nome}
                  className="h-3 w-3 rounded-full ring-1 ring-tinta/15"
                  style={{ backgroundColor: b.codigoHex ?? "#ccc" }}
                />
              ))}
            </div>
          )}
          <div className="mt-2">
            <Preco produto={produto} />
          </div>
        </div>
      </Link>

      <button
        onClick={() => alternar(produto.id)}
        aria-label={favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        aria-pressed={favorito}
        className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-marfim/90 backdrop-blur transition hover:text-ouro-profundo ${
          favorito ? "text-ouro-profundo" : "text-tinta md:opacity-0 md:group-hover:opacity-100"
        }`}
      >
        <IconeCoracao className="h-[1.1rem] w-[1.1rem]" cheio={favorito} />
      </button>
    </div>
  );
}
