import type { Produto } from "../lib/types";
import ProdutoCard from "./ProdutoCard";

export function GradeEsqueleto({ n = 8 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/5] bg-linha/50" />
          <div className="mt-4 h-2.5 w-16 bg-linha/60" />
          <div className="mt-2 h-4 w-40 bg-linha/60" />
          <div className="mt-2 h-4 w-20 bg-linha/60" />
        </div>
      ))}
    </div>
  );
}

export default function GradeProdutos({ produtos }: { produtos: Produto[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8">
      {produtos.map((p, i) => (
        <div key={p.id} className="animate-surgir" style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}>
          <ProdutoCard produto={p} />
        </div>
      ))}
    </div>
  );
}
