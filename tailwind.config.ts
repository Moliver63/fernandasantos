import type { Config } from "tailwindcss";

export default {
  content: ["./client/index.html", "./client/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Identidade visual FS Joias (manual de marca)
        marfim: "#F5F2E9", // Off White — fundo claro (sofisticação)
        onix: "#0B0D14", // Preto Elegante — fundos escuros
        safira: "#0E223D", // Azul Profundo — confiança, acento secundário
        "safira-claro": "#E3E8F0",
        ouro: "#D4AF37", // Dourado Nobre — destaque, CTA, detalhes
        // Ouro escurecido para TEXTO sobre fundo claro: o #D4AF37 puro não
        // passa contraste AA em cima do marfim, então só é usado em fundo
        // escuro ou em elementos decorativos.
        "ouro-profundo": "#8A6D1C",
        "ouro-claro": "#F6E3A1",
        tinta: "#16181F", // texto principal
        grafite: "#5E6270", // texto secundário
        linha: "#E2DCCB", // bordas e divisores
      },
      fontFamily: {
        display: ["Cinzel", "serif"], // títulos e wordmark (manual de marca)
        serif: ["Cinzel", "serif"],
        sans: ["Montserrat", "system-ui", "sans-serif"], // apoio / corpo
      },
      boxShadow: {
        joia: "0 18px 40px -18px rgba(11, 13, 20, 0.35)",
      },
      keyframes: {
        brilho: {
          "0%": { transform: "translateX(-120%) skewX(-20deg)" },
          "100%": { transform: "translateX(220%) skewX(-20deg)" },
        },
        surgir: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        brilho: "brilho 1.1s ease-out",
        surgir: "surgir .7s ease-out both",
      },
    },
  },
  plugins: [],
} satisfies Config;
