import { useState } from "react";
import { trpc } from "../../lib/trpc";
import type { VarianteTamanho, VarianteBanho } from "../../lib/types";
import { BANHOS_SUGERIDOS } from "@shared/const";
import { Card, campoBase } from "./AdminUI";

function ListaVariantes({
  variantes,
  onRemover,
  comCor,
  vazio,
}: {
  variantes: (VarianteTamanho | VarianteBanho)[];
  onRemover: (id: number) => void;
  comCor: boolean;
  vazio: string;
}) {
  if (variantes.length === 0) return <p className="mt-2 text-xs text-[#5E6270]">{vazio}</p>;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {variantes.map((v) => (
        <span key={v.id} className="flex items-center gap-2 rounded-full border border-black/10 bg-white py-1 pl-2 pr-1 text-sm text-[#16181F]">
          {comCor && (
            <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: v.codigoHex ?? "#ccc" }} />
          )}
          {v.nome}
          <button
            type="button"
            onClick={() => onRemover(v.id)}
            className="flex h-5 w-5 items-center justify-center rounded-full text-xs text-[#5E6270] hover:bg-red-50 hover:text-red-600"
            aria-label={`Remover ${v.nome}`}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

export default function GerenciarVariantes({
  produtoId,
  variantesTamanho,
  variantesBanho,
}: {
  produtoId: number;
  variantesTamanho: VarianteTamanho[];
  variantesBanho: VarianteBanho[];
}) {
  const utils = trpc.useUtils();
  const invalidar = { onSuccess: () => utils.produtos.buscarPorSlug.invalidate() };

  const criarTamanho = trpc.produtos.criarVarianteTamanho.useMutation(invalidar);
  const removerTamanho = trpc.produtos.removerVarianteTamanho.useMutation(invalidar);
  const criarBanho = trpc.produtos.criarVarianteBanho.useMutation(invalidar);
  const removerBanho = trpc.produtos.removerVarianteBanho.useMutation(invalidar);

  const [nomeBanho, setNomeBanho] = useState("");
  const [hexBanho, setHexBanho] = useState("#D4AF37");
  const [nomeTamanho, setNomeTamanho] = useState("");
  const [aroDe, setAroDe] = useState(12);
  const [aroAte, setAroAte] = useState(20);

  const banhosExistentes = new Set(variantesBanho.map((b) => b.nome));
  const tamanhosExistentes = new Set(variantesTamanho.map((t) => t.nome));

  async function gerarAros() {
    for (let n = aroDe; n <= aroAte; n++) {
      const nome = `Aro ${n}`;
      if (!tamanhosExistentes.has(nome)) await criarTamanho.mutateAsync({ produtoId, nome });
    }
  }

  return (
    <Card className="p-6">
      <p className="text-sm font-semibold text-[#16181F]">Banhos e tamanhos</p>
      <p className="mt-0.5 text-xs text-[#5E6270]">
        O cliente escolhe o banho (bolinha de cor) e o tamanho/aro na página da peça.
      </p>

      {/* Banhos */}
      <div className="mt-6">
        <p className="text-sm font-medium text-[#16181F]">Banhos / acabamentos</p>
        <ListaVariantes
          variantes={variantesBanho}
          comCor
          vazio="Nenhum banho cadastrado."
          onRemover={(id) => removerBanho.mutate({ id })}
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {BANHOS_SUGERIDOS.filter((b) => !banhosExistentes.has(b.nome)).map((b) => (
            <button
              key={b.nome}
              type="button"
              onClick={() => criarBanho.mutate({ produtoId, nome: b.nome, codigoHex: b.codigoHex })}
              className="flex items-center gap-1.5 rounded-full border border-dashed border-black/15 px-2.5 py-1 text-xs text-[#5E6270] hover:border-black/40"
            >
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: b.codigoHex }} />+ {b.nome}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input type="color" value={hexBanho} onChange={(e) => setHexBanho(e.target.value)} className="h-9 w-9 cursor-pointer rounded-lg border border-black/10" />
          <input value={nomeBanho} onChange={(e) => setNomeBanho(e.target.value)} placeholder="Outro banho (ex: Ouro velho)" className={`${campoBase} mt-0 flex-1`} />
          <button
            type="button"
            disabled={!nomeBanho.trim() || criarBanho.isPending}
            onClick={() => {
              criarBanho.mutate({ produtoId, nome: nomeBanho.trim(), codigoHex: hexBanho });
              setNomeBanho("");
            }}
            className="rounded-lg border border-black/10 px-3.5 py-2.5 text-sm font-medium text-[#16181F] disabled:opacity-40"
          >
            Adicionar
          </button>
        </div>
      </div>

      {/* Tamanhos */}
      <div className="mt-8 border-t border-black/5 pt-6">
        <p className="text-sm font-medium text-[#16181F]">Tamanhos / aros</p>
        <ListaVariantes
          variantes={variantesTamanho}
          comCor={false}
          vazio="Sem tamanhos (peça de tamanho único)."
          onRemover={(id) => removerTamanho.mutate({ id })}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#5E6270]">
          Gerar aros do
          <input type="number" min={8} max={35} value={aroDe} onChange={(e) => setAroDe(Number(e.target.value))} className="w-16 rounded-lg border border-black/10 px-2 py-1.5" />
          ao
          <input type="number" min={8} max={35} value={aroAte} onChange={(e) => setAroAte(Number(e.target.value))} className="w-16 rounded-lg border border-black/10 px-2 py-1.5" />
          <button
            type="button"
            onClick={gerarAros}
            disabled={criarTamanho.isPending || aroAte < aroDe}
            className="rounded-lg border border-black/10 px-3 py-1.5 font-medium text-[#16181F] disabled:opacity-40"
          >
            Gerar
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input value={nomeTamanho} onChange={(e) => setNomeTamanho(e.target.value)} placeholder="Outro tamanho (ex: Corrente 45 cm)" className={`${campoBase} mt-0 flex-1`} />
          <button
            type="button"
            disabled={!nomeTamanho.trim() || criarTamanho.isPending}
            onClick={() => {
              criarTamanho.mutate({ produtoId, nome: nomeTamanho.trim() });
              setNomeTamanho("");
            }}
            className="rounded-lg border border-black/10 px-3.5 py-2.5 text-sm font-medium text-[#16181F] disabled:opacity-40"
          >
            Adicionar
          </button>
        </div>
      </div>
    </Card>
  );
}
