import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { formatarBRL } from "@shared/const";
import { linkAtendimento } from "@shared/marca";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Seo from "../components/Seo";
import Monograma from "../components/Monograma";
import { CHAVE_PAGAMENTO } from "./Checkout";

type Pagamento = {
  codigoPedido: string;
  sucesso: boolean;
  metodo?: "PIX" | "BOLETO" | "CREDIT_CARD";
  linkPagamento?: string;
  qrCodePix?: string;
  copiaECola?: string;
  total?: number;
  erro?: string;
};

export default function PedidoConfirmado() {
  const { codigo } = useParams();
  const [pag, setPag] = useState<Pagamento | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    try {
      const bruto = sessionStorage.getItem(CHAVE_PAGAMENTO);
      const dados = bruto ? (JSON.parse(bruto) as Pagamento) : null;
      if (dados?.codigoPedido === codigo) setPag(dados);
    } catch {
      /* ignora */
    }
  }, [codigo]);

  async function copiar() {
    if (!pag?.copiaECola) return;
    try {
      await navigator.clipboard.writeText(pag.copiaECola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      /* navegador sem clipboard: o campo continua selecionável */
    }
  }

  return (
    <div>
      <Seo titulo="Pedido recebido" descricao="Seu pedido na FS Joias foi recebido." caminho={`/pedido/${codigo ?? ""}`} semIndexar />
      <Header />

      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <Monograma className="mx-auto h-20 w-20" />
        <p className="eyebrow mt-8 text-ouro-profundo">Pedido {codigo}</p>
        <h1 className="mt-3 font-display text-3xl text-tinta">
          {pag?.metodo === "PIX" && pag.sucesso ? "Falta só o Pix" : "Pedido recebido"}
        </h1>

        {pag && !pag.sucesso && (
          <p className="mt-6 bg-ouro/15 px-5 py-4 text-sm text-tinta">
            {pag.erro}{" "}
            <a href={linkAtendimento(`Olá! Fiz o pedido ${codigo} e a cobrança não foi gerada.`)} target="_blank" rel="noopener noreferrer" className="underline">
              Falar com a gente
            </a>
          </p>
        )}

        {pag?.sucesso && pag.metodo === "PIX" && pag.qrCodePix && (
          <div className="mt-8 bg-white p-7 shadow-joia">
            {pag.total != null && <p className="font-display text-2xl text-tinta">{formatarBRL(pag.total)}</p>}
            <img src={`data:image/png;base64,${pag.qrCodePix}`} alt="QR Code Pix" className="mx-auto mt-4 h-56 w-56" />
            <p className="mt-4 text-sm text-grafite">Abra o app do banco, escolha Pix e leia o QR Code ou use o copia e cola:</p>
            <textarea
              readOnly
              value={pag.copiaECola}
              onFocus={(e) => e.currentTarget.select()}
              className="mt-3 h-20 w-full resize-none border border-linha bg-marfim p-2 font-mono text-[0.65rem] text-grafite"
            />
            <button
              onClick={copiar}
              className="mt-3 w-full bg-onix py-3.5 text-xs font-semibold tracking-[0.22em] text-ouro transition hover:bg-safira"
            >
              {copiado ? "CÓDIGO COPIADO ✓" : "COPIAR CÓDIGO PIX"}
            </button>
            <p className="mt-4 text-xs text-grafite">A confirmação chega por e-mail assim que o pagamento cair.</p>
          </div>
        )}

        {pag?.sucesso && pag.metodo !== "PIX" && pag.linkPagamento && (
          <div className="mt-8">
            <p className="text-grafite">
              {pag.metodo === "BOLETO" ? "Seu boleto está pronto." : "Conclua o pagamento com cartão na página segura do Asaas."}
            </p>
            <a
              href={pag.linkPagamento}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block bg-onix px-8 py-4 text-xs font-semibold tracking-[0.22em] text-ouro transition hover:bg-safira"
            >
              {pag.metodo === "BOLETO" ? "ABRIR BOLETO" : "PAGAR COM CARTÃO"}
            </a>
          </div>
        )}

        {!pag && (
          <p className="mt-5 text-grafite">
            Assim que o pagamento for confirmado, separamos e embalamos sua joia. Você recebe cada etapa por e-mail.
          </p>
        )}

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Link href="/rastreio" className="border border-tinta px-7 py-3 text-xs font-semibold tracking-[0.2em] text-tinta transition hover:bg-onix hover:text-ouro">
            ACOMPANHAR PEDIDO
          </Link>
          <Link href="/" className="px-7 py-3 text-xs font-semibold tracking-[0.2em] text-grafite hover:text-tinta">
            CONTINUAR COMPRANDO
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
