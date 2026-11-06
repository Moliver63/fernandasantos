import { useEffect } from "react";
import { Link } from "wouter";
import { MARCA, linkAtendimento } from "@shared/marca";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Seo from "../components/Seo";
import Monograma from "../components/Monograma";
import { IconeInstagram } from "../components/Icones";

// Tabela de referência: diâmetro interno (mm) → numeração brasileira
const ARO = [
  [12, 15.9], [13, 16.2], [14, 16.6], [15, 16.9], [16, 17.2], [17, 17.5],
  [18, 17.8], [19, 18.2], [20, 18.5], [21, 18.8], [22, 19.1], [23, 19.4],
  [24, 19.7], [25, 20.1], [26, 20.4],
] as const;

function Bloco({ id, eyebrow, titulo, children }: { id: string; eyebrow: string; titulo: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-linha py-16">
      <p className="eyebrow text-ouro-profundo">{eyebrow}</p>
      <h2 className="mt-3 font-display text-2xl text-tinta md:text-3xl">{titulo}</h2>
      <div className="mt-6 space-y-4 leading-relaxed text-grafite">{children}</div>
    </section>
  );
}

export default function Sobre() {
  // Rola até a âncora (#cuidados, #garantia, #medidas) vinda de outro link
  useEffect(() => {
    if (window.location.hash) {
      setTimeout(() => document.querySelector(window.location.hash)?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }, []);

  return (
    <div>
      <Seo
        titulo="A marca, cuidados e garantia"
        descricao={`Conheça a ${MARCA.nome}, de ${MARCA.responsavel}: como cuidar das suas joias, garantia, trocas e como medir o aro do anel.`}
        caminho="/sobre"
      />
      <Header />

      <section className="fundo-onix">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-20 text-center">
          <Monograma className="h-24 w-24" />
          <p className="eyebrow mt-8 text-ouro">A marca</p>
          <h1 className="mt-4 font-display text-4xl leading-tight text-marfim md:text-5xl">
            Joia para usar, não para guardar
          </h1>
          <p className="mt-6 max-w-xl text-marfim/70">
            A {MARCA.nome} é a loja de {MARCA.responsavel}. Anéis, brincos, colares, pulseiras e
            alianças escolhidos a dedo, conferidos peça por peça e enviados para todo o Brasil.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6">
        <section className="py-16">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              ["Curadoria", "Cada modelo entra na loja depois de testado no uso: banho, cravação, fecho e conforto."],
              ["Conferência", "Antes de embalar, a peça é revisada de novo. Se algo não está perfeito, não sai."],
              ["Atendimento", "Dúvida de aro, de presente ou de combinação? A gente responde e ajuda a escolher."],
            ].map(([t, d]) => (
              <div key={t}>
                <p className="font-display text-lg text-tinta">{t}</p>
                <p className="mt-2 text-sm leading-relaxed text-grafite">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <Bloco id="cuidados" eyebrow="Cuidados" titulo="Para o brilho durar">
          <ul className="list-inside space-y-2">
            <li>◆ Coloque a joia por último, depois de perfume, creme e maquiagem.</li>
            <li>◆ Tire para tomar banho, nadar (piscina e mar), dormir e treinar.</li>
            <li>◆ Guarde cada peça separada, no saquinho ou no estojo, longe de umidade.</li>
            <li>◆ Limpe com flanela seca e macia. Nada de produtos químicos ou pasta de dente.</li>
          </ul>
        </Bloco>

        <Bloco id="garantia" eyebrow="Garantia e trocas" titulo="Comprou, está coberta">
          <p>
            <strong className="text-tinta">Garantia:</strong> as peças com banho têm garantia contra defeitos no
            banho e de fabricação pelo prazo indicado na página de cada produto (em geral 12 meses).
            Desgaste por mau uso, contato com produtos químicos e peças amassadas não entram na garantia.
          </p>
          <p>
            <strong className="text-tinta">Troca e devolução:</strong> você tem 7 dias corridos após o
            recebimento para trocar ou devolver, com a peça sem uso e na embalagem original (direito de
            arrependimento do Código de Defesa do Consumidor). Peças com gravação personalizada são
            feitas para você e não têm troca por arrependimento, só por defeito.
          </p>
          <p>
            Para acionar, fale com a gente pelo{" "}
            <a href={linkAtendimento("Olá! Quero falar sobre troca/garantia.")} target="_blank" rel="noopener noreferrer" className="text-ouro-profundo underline underline-offset-4">
              atendimento
            </a>{" "}
            com o código do pedido.
          </p>
        </Bloco>

        <Bloco id="medidas" eyebrow="Guia de medidas" titulo="Como descobrir o seu aro">
          <p>
            <strong className="text-tinta">Com um anel que já serve:</strong> meça o diâmetro interno (de
            borda a borda por dentro) com uma régua, em milímetros, e compare na tabela.
          </p>
          <p>
            <strong className="text-tinta">Com uma tira de papel:</strong> enrole no dedo, marque onde
            encontra, meça o comprimento em mm e divida por 3,14. O resultado é o diâmetro.
          </p>
          <p className="text-sm">Meça no fim do dia, quando o dedo está um pouco mais inchado. Na dúvida entre dois, escolha o maior.</p>
          <div className="overflow-hidden border border-linha">
            <table className="w-full text-sm">
              <thead className="bg-onix text-ouro">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium tracking-wider">Aro</th>
                  <th className="px-4 py-2.5 text-left font-medium tracking-wider">Diâmetro interno</th>
                </tr>
              </thead>
              <tbody>
                {ARO.map(([aro, mm], i) => (
                  <tr key={aro} className={i % 2 ? "bg-white/60" : ""}>
                    <td className="px-4 py-2 text-tinta">{aro}</td>
                    <td className="px-4 py-2">{mm.toFixed(1).replace(".", ",")} mm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Bloco>

        <section className="border-t border-linha py-16 text-center">
          <a
            href={MARCA.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-onix px-7 py-4 text-xs font-semibold tracking-[0.2em] text-ouro"
          >
            <IconeInstagram className="h-4 w-4" />@{MARCA.instagramUsuario.toUpperCase()}
          </a>
          <p className="mt-6">
            <Link href="/catalogo/aneis" className="text-sm text-grafite underline underline-offset-4 hover:text-tinta">
              Voltar para a loja
            </Link>
          </p>
        </section>
      </div>

      <Footer />
    </div>
  );
}
