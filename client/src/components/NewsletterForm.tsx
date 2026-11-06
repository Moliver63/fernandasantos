import { useState, type FormEvent } from "react";
import { trpc } from "../lib/trpc";
import { rastrear } from "../lib/rastreamento";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const cadastrar = trpc.leads.cadastrar.useMutation({
    onSuccess: () => rastrear("Lead", { content_name: "newsletter" }),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    cadastrar.mutate({ email });
  }

  if (cadastrar.isSuccess) {
    return <p className="text-sm text-ouro">Pronto! Você está na lista.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="seu@email.com"
        aria-label="Seu e-mail"
        className="min-w-0 flex-1 border-b border-marfim/30 bg-transparent px-1 py-3 text-sm text-marfim placeholder:text-marfim/40 focus:border-ouro focus:outline-none"
      />
      <button
        type="submit"
        disabled={cadastrar.isPending}
        className="bg-ouro px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-onix transition hover:bg-ouro-claro disabled:opacity-50"
      >
        {cadastrar.isPending ? "Enviando…" : "Entrar na lista"}
      </button>
      {cadastrar.isError && <p className="text-xs text-red-300">Não foi possível cadastrar. Tente de novo.</p>}
    </form>
  );
}
