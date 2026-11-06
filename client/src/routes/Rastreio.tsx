import { useState, type FormEvent } from "react";
import { trpc } from "../lib/trpc";
import { labelStatusPedido } from "@shared/const";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Seo from "../components/Seo";

export default function Rastreio() {
  const [codigoPedido, setCodigoPedido] = useState("");
  const [email, setEmail] = useState("");
  const [consultado, setConsultado] = useState<{ codigo: string; email: string } | null>(null);

  const { data: resultado, isFetching, error } = trpc.rastreio.consultar.useQuery(
    { codigoPedido: consultado?.codigo ?? "", email: consultado?.email ?? "" },
    { enabled: !!consultado, retry: false }
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!codigoPedido.trim() || !email.trim()) return;
    setConsultado({ codigo: codigoPedido.trim(), email: email.trim() });
  }

  return (
    <div>
      <Seo
        titulo="Rastrear pedido"
        descricao="Acompanhe o status do seu pedido na FS Joias."
        caminho="/rastreio"
      />
      <Header />

      <section className="mx-auto max-w-lg px-6 py-16">
        <p className="eyebrow text-ouro-profundo">Rastreamento</p>
        <h1 className="mt-1 font-serif text-3xl text-tinta">Onde está minha joia?</h1>
        <p className="mt-3 text-grafite">
          Digite o código do pedido (enviado por e-mail na confirmação da compra) e o
          e-mail usado na compra.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            value={codigoPedido}
            onChange={(e) => setCodigoPedido(e.target.value)}
            placeholder="Código do pedido (ex: FS-2026-1234)"
            className="border-b border-linha bg-transparent px-1 py-2.5 focus:border-tinta focus:outline-none text-tinta"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail usado na compra"
            className="border-b border-linha bg-transparent px-1 py-2.5 focus:border-tinta focus:outline-none text-tinta"
          />
          <button
            type="submit"
            disabled={isFetching}
            className="bg-onix px-6 py-3.5 text-xs font-semibold tracking-[0.2em] text-ouro transition hover:bg-safira disabled:opacity-50"
          >
            {isFetching ? "Consultando…" : "Rastrear pedido"}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-sm text-red-600">
            {error.message}
          </p>
        )}

        {resultado && (
          <div className="mt-8 bg-white p-6 shadow-joia">
            <p className="eyebrow text-grafite/60">Pedido {resultado.codigoPedido}</p>
            <p className="mt-1 text-lg font-medium text-tinta">
              {labelStatusPedido(resultado.status)}
            </p>

            {resultado.codigoRastreio && (
              <p className="mt-2 text-sm text-grafite">
                {resultado.transportadora && `${resultado.transportadora} — `}
                Código de rastreio: <strong>{resultado.codigoRastreio}</strong>
              </p>
            )}

            <div className="mt-5 space-y-4 border-t border-linha pt-4">
              {resultado.eventos.map((evento, i) => (
                <div key={i} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-ouro" />
                  <div>
                    <p className="text-sm font-medium text-tinta">
                      {labelStatusPedido(evento.status)}
                    </p>
                    {evento.descricao && (
                      <p className="text-sm text-grafite">{evento.descricao}</p>
                    )}
                    <p className="text-xs text-grafite/60">
                      {new Date(evento.criadoEm).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
