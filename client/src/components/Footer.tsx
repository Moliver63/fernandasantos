import { Link } from "wouter";
import { CATEGORIAS } from "@shared/const";
import { MARCA, linkAtendimento } from "@shared/marca";
import NewsletterForm from "./NewsletterForm";
import Monograma from "./Monograma";
import { IconeInstagram } from "./Icones";

export default function Footer() {
  return (
    <footer className="fundo-onix mt-24 text-marfim/75">
      <div className="mx-auto grid max-w-7xl gap-10 border-b border-marfim/10 px-6 py-14 md:grid-cols-[1.2fr_1fr] lg:px-8">
        <div>
          <p className="eyebrow text-ouro">Lista VIP</p>
          <p className="mt-2 max-w-md font-display text-2xl text-marfim">
            Lançamentos e reposições antes de todo mundo.
          </p>
        </div>
        <div className="self-end">
          <NewsletterForm />
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <Monograma className="h-12 w-12" />
            <div className="leading-none">
              <p className="font-display text-lg tracking-[0.22em] texto-ouro">FS JOIAS</p>
              <p className="mt-1 text-[0.55rem] tracking-[0.42em] text-ouro/70">JOIAS E ALIANÇAS</p>
            </div>
          </div>
          <p className="mt-5 max-w-xs text-sm leading-relaxed">
            Joias escolhidas uma a uma por {MARCA.responsavel}, com acabamento que dura e
            garantia de verdade. Para usar todo dia e para marcar os dias que importam.
          </p>
          <a
            href={MARCA.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-sm text-ouro hover:text-ouro-claro"
          >
            <IconeInstagram className="h-5 w-5" />@{MARCA.instagramUsuario}
          </a>
        </div>

        <div>
          <p className="eyebrow text-ouro">Coleções</p>
          <nav className="mt-5 flex flex-col gap-2.5 text-sm">
            {CATEGORIAS.map((c) => (
              <Link key={c.valor} href={`/catalogo/${c.valor}`} className="hover:text-ouro">
                {c.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <p className="eyebrow text-ouro">Ajuda</p>
          <nav className="mt-5 flex flex-col gap-2.5 text-sm">
            <Link href="/rastreio" className="hover:text-ouro">Rastrear pedido</Link>
            <Link href="/sobre#cuidados" className="hover:text-ouro">Cuidados com a joia</Link>
            <Link href="/sobre#garantia" className="hover:text-ouro">Garantia e trocas</Link>
            <Link href="/sobre#medidas" className="hover:text-ouro">Como medir o aro</Link>
            <Link href="/favoritos" className="hover:text-ouro">Meus favoritos</Link>
          </nav>
        </div>

        <div>
          <p className="eyebrow text-ouro">Atendimento</p>
          <div className="mt-5 flex flex-col gap-2.5 text-sm">
            <a href={linkAtendimento("Olá! Vim pelo site da FS Joias.")} target="_blank" rel="noopener noreferrer" className="hover:text-ouro">
              {MARCA.whatsapp ? "WhatsApp" : "Direct do Instagram"}
            </a>
            <a href={`mailto:${MARCA.emailContato}`} className="hover:text-ouro">
              {MARCA.emailContato}
            </a>
            <p>Pix, boleto ou cartão em até 6x</p>
          </div>
        </div>
      </div>

      <div className="border-t border-marfim/10 px-6 py-6 text-center text-xs text-marfim/45">
        © {new Date().getFullYear()} {MARCA.nomeCompleto}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
