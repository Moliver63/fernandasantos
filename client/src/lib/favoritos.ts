import { useEffect, useState } from "react";

// Lista de desejos local (sem login): só ids no localStorage, sincronizada
// entre componentes e abas por um evento.
const CHAVE = "fsjoias:favoritos:v1";
const EVENTO = "fsjoias:favoritos";

function ler(): number[] {
  try {
    const v = JSON.parse(localStorage.getItem(CHAVE) ?? "[]");
    return Array.isArray(v) ? v.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

export function useFavoritos() {
  const [ids, setIds] = useState<number[]>(ler);

  useEffect(() => {
    const atualizar = () => setIds(ler());
    window.addEventListener(EVENTO, atualizar);
    window.addEventListener("storage", atualizar);
    return () => {
      window.removeEventListener(EVENTO, atualizar);
      window.removeEventListener("storage", atualizar);
    };
  }, []);

  function alternar(id: number) {
    const atual = ler();
    const novo = atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id];
    try {
      localStorage.setItem(CHAVE, JSON.stringify(novo));
    } catch {
      /* ignora */
    }
    window.dispatchEvent(new Event(EVENTO));
  }

  return { ids, ehFavorito: (id: number) => ids.includes(id), alternar };
}
