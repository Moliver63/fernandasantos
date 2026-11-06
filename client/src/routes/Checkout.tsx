import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { DESCONTO_PIX, PARCELAS_MAX, formatarBRL } from "@shared/const";
import { precoUnitarioItem, useCarrinho } from "../lib/carrinho-context";
import { trpc } from "../lib/trpc";
import { lerAtribuicao, rastrear } from "../lib/rastreamento";
import { validarDocumento, formatarDocumento } from "../lib/validadores";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Seo from "../components/Seo";
import { SemFoto } from "../components/Monograma";
import { IconeEscudo } from "../components/Icones";

type Metodo = "PIX" | "BOLETO" | "CREDIT_CARD";

export const CHAVE_PAGAMENTO = "fsjoias:pagamento";

function Campo({
  label,
  erro,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; erro?: string | null }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-medium tracking-wide text-grafite">{label}</span>
      <input
        {...props}
        className={`mt-1 w-full border-b bg-transparent py-2.5 text-tinta focus:outline-none ${
          erro ? "border-red-400" : "border-linha focus:border-tinta"
        }`}
      />
      {erro && <span className="mt-1 block text-xs text-red-600">{erro}</span>}
    </label>
  );
}

function Etapa({ n, titulo, children }: { n: number; titulo: string; children: ReactNode }) {
  return (
    <section className="border-b border-linha pb-10 pt-8 first:pt-0">
      <h2 className="flex items-center gap-3 font-display text-lg text-tinta">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-onix text-xs text-ouro">{n}</span>
        {titulo}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function Checkout() {
  const { itens, subtotal, limparCarrinho } = useCarrinho();
  const [, navegar] = useLocation();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [documento, setDocumento] = useState("");
  const [metodoPagamento, setMetodoPagamento] = useState<Metodo>("PIX");
  const [endereco, setEndereco] = useState({
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    pais: "BR",
  });

  const [erro, setErro] = useState<string | null>(null);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [cepNaoEncontrado, setCepNaoEncontrado] = useState(false);
  const [documentoTocado, setDocumentoTocado] = useState(false);
  const criarPedido = trpc.checkout.criarPedido.useMutation();
  const enviando = criarPedido.isPending;
  const iniciou = useRef(false);

  useEffect(() => {
    if (iniciou.current || itens.length === 0) return;
    iniciou.current = true;
    rastrear("InitiateCheckout", {
      content_ids: itens.map((i) => String(i.produtoId)),
      num_items: itens.reduce((s, i) => s + i.quantidade, 0),
      value: subtotal,
      currency: "BRL",
    });
  }, [itens, subtotal]);

  const cepLimpo = endereco.cep.replace(/\D/g, "");

  // Autocompleta endereço pelo CEP (ViaCEP — gratuito, sem chave)
  useEffect(() => {
    if (cepLimpo.length !== 8) {
      setCepNaoEncontrado(false);
      return;
    }
    let cancelado = false;
    setBuscandoCep(true);
    setCepNaoEncontrado(false);
    fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      .then((r) => r.json())
      .then((dados) => {
        if (cancelado) return;
        if (dados.erro) {
          setCepNaoEncontrado(true);
          return;
        }
        setEndereco((atual) => ({
          ...atual,
          logradouro: dados.logradouro || atual.logradouro,
          bairro: dados.bairro || atual.bairro,
          cidade: dados.localidade || atual.cidade,
          uf: dados.uf || atual.uf,
        }));
      })
      .catch(() => !cancelado && setCepNaoEncontrado(true))
      .finally(() => !cancelado && setBuscandoCep(false));
    return () => {
      cancelado = true;
    };
  }, [cepLimpo]);

  const documentoValido = !documentoTocado || documento.trim() === "" || validarDocumento(documento);
  const { data: frete, isFetching: calculandoFrete } = trpc.frete.calcular.useQuery(
    { cep: cepLimpo },
    { enabled: cepLimpo.length === 8 }
  );
  const valorFrete = frete?.encontrado ? frete.valor : 0;
  const desconto = metodoPagamento === "PIX" ? subtotal * DESCONTO_PIX : 0;
  const total = subtotal - desconto + valorFrete;

  async function finalizarPedido(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!validarDocumento(documento)) {
      setDocumentoTocado(true);
      setErro(documento.trim() ? "CPF ou CNPJ inválido. Confira os números." : "Informe um CPF ou CNPJ válido.");
      return;
    }
    if (!endereco.numero.trim() || !endereco.logradouro.trim()) {
      setErro("Complete o endereço de entrega.");
      return;
    }

    try {
      const resposta = await criarPedido.mutateAsync({
        cliente: { nome, email, telefone, documento },
        enderecoEntrega: endereco,
        itens: itens.map((i) => ({
          produtoId: i.produtoId,
          varianteBanhoId: i.varianteBanhoId,
          varianteTamanhoId: i.varianteTamanhoId ?? null,
          quantidade: i.quantidade,
          personalizado: !!i.personalizacao?.textoGravacao,
          textoGravacao: i.personalizacao?.textoGravacao,
          observacoesCliente: [i.varianteBanhoNome, i.varianteTamanhoNome].filter(Boolean).join(" · ") || undefined,
        })),
        metodoPagamento,
        atribuicao: lerAtribuicao(),
      });

      // A página de confirmação mostra o QR Code do Pix / link do boleto
      // ou cartão. Fica no sessionStorage (não na URL) porque o
      // copia-e-cola do Pix é longo e não deve ir pro histórico.
      try {
        sessionStorage.setItem(
          CHAVE_PAGAMENTO,
          JSON.stringify({ ...resposta, metodo: metodoPagamento, email })
        );
      } catch {
        /* ignora */
      }

      limparCarrinho();
      navegar(`/pedido/${resposta.codigoPedido}`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao finalizar pedido");
    }
  }

  if (itens.length === 0) {
    return (
      <div>
        <Header />
        <div className="mx-auto max-w-xl px-6 py-24 text-center">
          <p className="text-grafite">Sua sacola está vazia.</p>
          <Link href="/" className="mt-6 inline-block bg-onix px-7 py-3 text-xs font-semibold tracking-[0.2em] text-ouro">
            VER JOIAS
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Seo titulo="Finalizar compra" descricao="Finalize seu pedido na FS Joias." caminho="/checkout" semIndexar />
      <Header />

      <form onSubmit={finalizarPedido} className="mx-auto grid max-w-6xl gap-12 px-6 py-12 lg:grid-cols-[1fr_400px] lg:px-8">
        <div>
          <Link href="/carrinho" className="text-sm text-grafite hover:text-tinta">‹ Voltar à sacola</Link>
          <h1 className="mt-3 font-display text-3xl text-tinta">Finalizar compra</h1>

          <div className="mt-10">
            <Etapa n={1} titulo="Seus dados">
              <div className="grid gap-6 sm:grid-cols-2">
                <Campo label="Nome completo" required autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} className="sm:col-span-2" />
                <Campo label="E-mail" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Campo label="Celular com DDD" type="tel" required autoComplete="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
                <Campo
                  label="CPF ou CNPJ"
                  required
                  inputMode="numeric"
                  value={documento}
                  onChange={(e) => setDocumento(formatarDocumento(e.target.value))}
                  onBlur={() => setDocumentoTocado(true)}
                  erro={documentoValido ? null : "CPF ou CNPJ inválido."}
                />
              </div>
            </Etapa>

            <Etapa n={2} titulo="Entrega">
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-3 sm:col-span-2">
                  <Campo
                    label="CEP"
                    required
                    inputMode="numeric"
                    autoComplete="postal-code"
                    value={endereco.cep}
                    onChange={(e) => setEndereco({ ...endereco, cep: e.target.value })}
                  />
                  {buscandoCep && <p className="mt-1 text-xs text-grafite">Buscando endereço…</p>}
                  {cepNaoEncontrado && <p className="mt-1 text-xs text-red-600">CEP não encontrado. Preencha à mão.</p>}
                </div>
                <Campo label="Endereço" required value={endereco.logradouro} onChange={(e) => setEndereco({ ...endereco, logradouro: e.target.value })} className="col-span-6 sm:col-span-4" />
                <Campo label="Número" required value={endereco.numero} onChange={(e) => setEndereco({ ...endereco, numero: e.target.value })} className="col-span-3 sm:col-span-2" />
                <Campo label="Complemento" value={endereco.complemento} onChange={(e) => setEndereco({ ...endereco, complemento: e.target.value })} className="col-span-3 sm:col-span-4" />
                <Campo label="Bairro" required value={endereco.bairro} onChange={(e) => setEndereco({ ...endereco, bairro: e.target.value })} className="col-span-6 sm:col-span-2" />
                <Campo label="Cidade" required value={endereco.cidade} onChange={(e) => setEndereco({ ...endereco, cidade: e.target.value })} className="col-span-4 sm:col-span-3" />
                <Campo label="UF" required maxLength={2} value={endereco.uf} onChange={(e) => setEndereco({ ...endereco, uf: e.target.value.toUpperCase() })} className="col-span-2 sm:col-span-1" />
              </div>
              {cepLimpo.length === 8 && (
                <p className="mt-6 bg-white/70 px-4 py-3 text-sm text-grafite">
                  {calculandoFrete && "Calculando frete…"}
                  {!calculandoFrete && frete?.encontrado && (
                    <>
                      Frete para {frete.regiao}: <strong className="text-tinta">{formatarBRL(frete.valor)}</strong>, chega em até{" "}
                      {frete.prazoDias} dias úteis após o envio.
                    </>
                  )}
                  {!calculandoFrete && frete && !frete.encontrado && <span className="text-red-600">{frete.mensagem}</span>}
                </p>
              )}
            </Etapa>

            <Etapa n={3} titulo="Pagamento">
              <div className="grid gap-3 sm:grid-cols-3">
                {(
                  [
                    { v: "PIX", t: "Pix", d: `${Math.round(DESCONTO_PIX * 100)}% de desconto` },
                    { v: "CREDIT_CARD", t: "Cartão", d: `até ${PARCELAS_MAX}x sem juros` },
                    { v: "BOLETO", t: "Boleto", d: "compensa em até 2 dias" },
                  ] as const
                ).map((m) => (
                  <button
                    type="button"
                    key={m.v}
                    onClick={() => setMetodoPagamento(m.v)}
                    aria-pressed={metodoPagamento === m.v}
                    className={`border px-4 py-4 text-left transition ${
                      metodoPagamento === m.v ? "border-onix bg-onix text-marfim" : "border-linha bg-white/60 text-tinta hover:border-tinta"
                    }`}
                  >
                    <span className="block font-medium">{m.t}</span>
                    <span className={`text-xs ${metodoPagamento === m.v ? "text-ouro" : "text-grafite"}`}>{m.d}</span>
                  </button>
                ))}
              </div>
              <p className="mt-4 flex items-center gap-2 text-xs text-grafite">
                <IconeEscudo className="h-4 w-4 text-ouro-profundo" />
                Pagamento processado pelo Asaas. {metodoPagamento === "CREDIT_CARD" ? "Os dados do cartão são digitados na página segura do Asaas, nunca aqui." : ""}
              </p>
            </Etapa>
          </div>
        </div>

        <aside className="h-fit bg-white p-7 shadow-joia lg:sticky lg:top-28">
          <p className="eyebrow text-grafite">Seu pedido</p>
          <ul className="mt-5 max-h-72 space-y-4 overflow-y-auto">
            {itens.map((i) => (
              <li key={i.uid} className="flex gap-3">
                <div className="relative h-16 w-14 flex-shrink-0 overflow-hidden bg-linha/40">
                  {i.produto.imagens?.[0] ? <img src={i.produto.imagens[0]} alt="" className="h-full w-full object-cover" /> : <SemFoto />}
                  <span className="absolute -right-0 -top-0 flex h-5 w-5 items-center justify-center bg-onix text-[0.65rem] text-ouro">
                    {i.quantidade}
                  </span>
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate text-tinta">{i.produto.nome}</p>
                  <p className="text-xs text-grafite">
                    {[i.varianteBanhoNome, i.varianteTamanhoNome].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <p className="text-sm text-tinta">{formatarBRL(precoUnitarioItem(i) * i.quantidade)}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-2 border-t border-linha pt-5 text-sm">
            <div className="flex justify-between"><dt className="text-grafite">Subtotal</dt><dd>{formatarBRL(subtotal)}</dd></div>
            {desconto > 0 && (
              <div className="flex justify-between text-ouro-profundo"><dt>Desconto Pix</dt><dd>−{formatarBRL(desconto)}</dd></div>
            )}
            <div className="flex justify-between">
              <dt className="text-grafite">Frete</dt>
              <dd>{frete?.encontrado ? formatarBRL(valorFrete) : <span className="text-grafite">informe o CEP</span>}</dd>
            </div>
            <div className="flex justify-between border-t border-linha pt-4 text-base">
              <dt className="font-medium text-tinta">Total</dt>
              <dd className="font-display text-xl text-tinta">{formatarBRL(total)}</dd>
            </div>
          </dl>

          {erro && <p className="mt-4 text-sm text-red-600">{erro}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="mt-6 w-full bg-onix py-4 text-xs font-semibold tracking-[0.22em] text-ouro transition hover:bg-safira disabled:opacity-50"
          >
            {enviando ? "PROCESSANDO…" : metodoPagamento === "PIX" ? "GERAR PIX" : "IR PARA O PAGAMENTO"}
          </button>
          <p className="mt-3 text-center text-[0.7rem] leading-relaxed text-grafite">
            O valor final é conferido pelo nosso sistema ao gerar a cobrança.
          </p>
        </aside>
      </form>

      <Footer />
    </div>
  );
}
