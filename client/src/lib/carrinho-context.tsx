import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { precoEfetivo } from "@shared/const";
import type { ItemCarrinho } from "./types";
import { rastrear } from "./rastreamento";

type NovoItem = Omit<ItemCarrinho, "uid">;

interface CarrinhoContextValue {
  itens: ItemCarrinho[];
  adicionarItem: (item: NovoItem) => void;
  removerItem: (uid: string) => void;
  atualizarQuantidade: (uid: string, quantidade: number) => void;
  limparCarrinho: () => void;
  totalItens: number;
  subtotal: number;
  // Confirmação visual ao adicionar — o mini-carrinho lateral escuta isso
  ultimoItemAdicionado: ItemCarrinho | null;
  drawerAberto: boolean;
  abrirDrawer: () => void;
  fecharDrawer: () => void;
}

const CHAVE = "fsjoias:carrinho:v1";
const CarrinhoContext = createContext<CarrinhoContextValue | null>(null);

function gerarUid(i: NovoItem) {
  return [
    i.produtoId,
    i.varianteBanhoId ?? 0,
    i.varianteTamanhoId ?? 0,
    (i.personalizacao?.textoGravacao ?? "").trim().toLowerCase(),
  ].join("|");
}

export function precoUnitarioItem(i: Pick<ItemCarrinho, "produto" | "personalizacao">) {
  const gravacao = i.personalizacao?.textoGravacao?.trim()
    ? Number(i.produto.custoPersonalizacao ?? 0)
    : 0;
  return precoEfetivo(i.produto) + gravacao;
}

function carregar(): ItemCarrinho[] {
  try {
    const bruto = localStorage.getItem(CHAVE);
    const lista = bruto ? (JSON.parse(bruto) as ItemCarrinho[]) : [];
    return Array.isArray(lista) ? lista.filter((i) => i && i.uid && i.produto) : [];
  } catch {
    return [];
  }
}

export function CarrinhoProvider({ children }: { children: ReactNode }) {
  // Carrinho sobrevive a recarregar a página e a fechar a aba — antes
  // ficava só em memória, e qualquer F5 esvaziava a sacola.
  const [itens, setItens] = useState<ItemCarrinho[]>(carregar);
  const [ultimoItemAdicionado, setUltimoItemAdicionado] = useState<ItemCarrinho | null>(null);
  const [drawerAberto, setDrawerAberto] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(itens));
    } catch {
      /* navegação privada / quota — segue só em memória */
    }
  }, [itens]);

  function adicionarItem(novo: NovoItem) {
    const item: ItemCarrinho = { ...novo, uid: gerarUid(novo) };
    setItens((atual) => {
      const existente = atual.findIndex((i) => i.uid === item.uid);
      if (existente >= 0) {
        const copia = [...atual];
        copia[existente] = {
          ...copia[existente],
          quantidade: Math.min(20, copia[existente].quantidade + item.quantidade),
        };
        return copia;
      }
      return [...atual, item];
    });

    rastrear("AddToCart", {
      content_ids: [String(item.produtoId)],
      content_name: item.produto.nome,
      content_type: "product",
      value: precoUnitarioItem(item) * item.quantidade,
      currency: "BRL",
    });

    setUltimoItemAdicionado(item);
    setDrawerAberto(true);
  }

  function removerItem(uid: string) {
    setItens((atual) => atual.filter((i) => i.uid !== uid));
  }

  function atualizarQuantidade(uid: string, quantidade: number) {
    setItens((atual) =>
      atual.map((i) => (i.uid === uid ? { ...i, quantidade: Math.max(1, Math.min(20, quantidade)) } : i))
    );
  }

  const totalItens = itens.reduce((soma, i) => soma + i.quantidade, 0);
  const subtotal = itens.reduce((soma, i) => soma + precoUnitarioItem(i) * i.quantidade, 0);

  return (
    <CarrinhoContext.Provider
      value={{
        itens,
        adicionarItem,
        removerItem,
        atualizarQuantidade,
        limparCarrinho: () => setItens([]),
        totalItens,
        subtotal,
        ultimoItemAdicionado,
        drawerAberto,
        abrirDrawer: () => setDrawerAberto(true),
        fecharDrawer: () => setDrawerAberto(false),
      }}
    >
      {children}
    </CarrinhoContext.Provider>
  );
}

export function useCarrinho() {
  const ctx = useContext(CarrinhoContext);
  if (!ctx) throw new Error("useCarrinho precisa estar dentro de CarrinhoProvider");
  return ctx;
}
