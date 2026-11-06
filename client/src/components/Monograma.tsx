import { useId } from "react";

// Monograma FS vetorizado a partir da logo (círculo + F + S). Vetor em vez
// de PNG: nítido em qualquer tamanho e recolorível (ouro no escuro,
// ônix no claro) sem precisar de um arquivo por variação.
export default function Monograma({
  className,
  variante = "ouro",
  comCirculo = true,
}: {
  className?: string;
  variante?: "ouro" | "onix" | "marfim";
  comCirculo?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const preenchimento =
    variante === "ouro" ? `url(#g${id})` : variante === "onix" ? "#0B0D14" : "#F5F2E9";

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      {variante === "ouro" && (
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F6E3A1" />
            <stop offset=".35" stopColor="#D4AF37" />
            <stop offset=".6" stopColor="#9A7B22" />
            <stop offset=".85" stopColor="#E9C766" />
            <stop offset="1" stopColor="#B8921F" />
          </linearGradient>
        </defs>
      )}
      {comCirculo && (
        <circle cx="50" cy="50" r="41" fill="none" stroke={preenchimento} strokeWidth="1.6" />
      )}
      <path
        fill={preenchimento}
        d="M41 18.5H70V25H41.6Q36.3 25 36.3 30.3V80.4L28.7 83.2V30.8Q28.7 18.5 41 18.5Z"
      />
      <path
        fill={preenchimento}
        d="M46.6 32.6H67V39H47.4V45.4H61.4Q67 45.4 67 51V58.2Q67 63.8 61.4 63.8H40.8V57.4H61V51.8H40.8V38.4Q40.8 32.6 46.6 32.6Z"
      />
    </svg>
  );
}

// Wordmark tipográfico (Cinzel), igual ao "FS JOIAS / JOIAS E ALIANÇAS"
export function Wordmark({ claro = false, compacto = false }: { claro?: boolean; compacto?: boolean }) {
  return (
    <span className="flex flex-col leading-none">
      <span
        className={`font-display font-semibold tracking-[0.22em] ${compacto ? "text-base" : "text-lg"} ${
          claro ? "texto-ouro" : "text-tinta"
        }`}
      >
        FS JOIAS
      </span>
      {!compacto && (
        <span
          className={`mt-1 text-[0.55rem] font-medium tracking-[0.42em] ${
            claro ? "text-ouro/80" : "text-ouro-profundo"
          }`}
        >
          JOIAS E ALIANÇAS
        </span>
      )}
    </span>
  );
}

// Placeholder elegante para peças ainda sem foto
export function SemFoto({ className = "" }: { className?: string }) {
  return (
    <div className={`fundo-onix flex h-full w-full items-center justify-center ${className}`}>
      <Monograma className="h-1/3 w-1/3 opacity-80" />
    </div>
  );
}
