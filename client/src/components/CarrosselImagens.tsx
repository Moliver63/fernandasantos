import { useState } from "react";
import { SemFoto } from "./Monograma";

export default function CarrosselImagens({
  imagens,
  nomeProduto,
}: {
  imagens: string[];
  nomeProduto: string;
}) {
  const [indiceAtivo, setIndiceAtivo] = useState(0);
  const lista = imagens.length > 0 ? imagens : [undefined];

  function anterior() {
    setIndiceAtivo((i) => (i === 0 ? lista.length - 1 : i - 1));
  }

  function proxima() {
    setIndiceAtivo((i) => (i === lista.length - 1 ? 0 : i + 1));
  }

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden bg-linha/30">
        {lista[indiceAtivo] ? (
          <img
            src={lista[indiceAtivo]}
            alt={`${nomeProduto} — foto ${indiceAtivo + 1} de ${lista.length}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <SemFoto />
        )}

        {lista.length > 1 && (
          <>
            <button
              type="button"
              onClick={anterior}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-marfim/90 text-tinta shadow hover:bg-marfim"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={proxima}
              aria-label="Próxima foto"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-marfim/90 text-tinta shadow hover:bg-marfim"
            >
              ›
            </button>

            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {lista.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full transition ${
                    i === indiceAtivo ? "bg-marfim" : "bg-marfim/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {lista.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {lista.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndiceAtivo(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === indiceAtivo}
              className={`h-16 w-16 flex-shrink-0 overflow-hidden border-2 transition ${
                i === indiceAtivo ? "border-ouro" : "border-transparent opacity-70"
              }`}
            >
              {url ? (
                <img src={url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-linha/40" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
