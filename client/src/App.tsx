import { lazy, Suspense, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import Home from "./routes/Home";
import Catalogo from "./routes/Catalogo";
import ProdutoDetalhe from "./routes/ProdutoDetalhe";
import Carrinho from "./routes/Carrinho";
import Checkout from "./routes/Checkout";
import PedidoConfirmado from "./routes/PedidoConfirmado";
import Sobre from "./routes/Sobre";
import Busca from "./routes/Busca";
import Favoritos from "./routes/Favoritos";
import Rastreio from "./routes/Rastreio";
import BotaoWhatsApp from "./components/BotaoWhatsApp";
import MiniCarrinhoDrawer from "./components/MiniCarrinhoDrawer";
import { CarrinhoProvider } from "./lib/carrinho-context";
import { trpc } from "./lib/trpc";
import { capturarAtribuicao, iniciarPixels, paginaVista } from "./lib/rastreamento";

capturarAtribuicao();

// Todo o admin é carregado sob demanda — quem visita a loja nunca
// baixa esse código (nem a recharts, que só o financeiro usa e é
// pesada). Sem isso, o bundle público quase dobrava de tamanho por
// causa de uma biblioteca de gráfico que só o admin usa.
const AdminLogin = lazy(() => import("./routes/admin/AdminLogin"));
const AdminProdutos = lazy(() => import("./routes/admin/AdminProdutos"));
const AdminProdutoForm = lazy(() => import("./routes/admin/AdminProdutoForm"));
const AdminLeads = lazy(() => import("./routes/admin/AdminLeads"));
const AdminPedidos = lazy(() => import("./routes/admin/AdminPedidos"));
const AdminPedidoDetalhe = lazy(() => import("./routes/admin/AdminPedidoDetalhe"));
const AdminClientes = lazy(() => import("./routes/admin/AdminClientes"));
const AdminEmails = lazy(() => import("./routes/admin/AdminEmails"));
const AdminCategorias = lazy(() => import("./routes/admin/AdminCategorias"));
const AdminFinanceiro = lazy(() => import("./routes/admin/AdminFinanceiro"));

function NaoEncontrada() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-onix px-6 text-center">
      <p className="font-display text-6xl texto-ouro">404</p>
      <p className="mt-4 text-marfim/70">Esta página não existe mais.</p>
      <a href="/" className="mt-8 bg-ouro px-7 py-3 text-xs font-semibold tracking-[0.2em] text-onix">VOLTAR À LOJA</a>
    </div>
  );
}

function CarregandoAdmin() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F4F1] text-sm text-[#8C7A6B]">
      Carregando…
    </div>
  );
}

export default function App() {
  const [location] = useLocation();
  const ehAdmin = location.startsWith("/admin");

  // Pixel/GA4 só na loja (nunca no admin) e só se configurados no server
  const { data: config } = trpc.config.publico.useQuery(undefined, {
    enabled: !ehAdmin,
    staleTime: Infinity,
  });
  useEffect(() => {
    if (config) iniciarPixels(config);
  }, [config]);

  // PageView a cada troca de rota da SPA (o primeiro sai no init do Pixel)
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!ehAdmin) paginaVista();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  return (
    <CarrinhoProvider>
      <Suspense fallback={ehAdmin ? <CarregandoAdmin /> : null}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/catalogo/:categoria" component={Catalogo} />
          <Route path="/produto/:slug" component={ProdutoDetalhe} />
          <Route path="/carrinho" component={Carrinho} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/pedido/:codigo" component={PedidoConfirmado} />
          <Route path="/sobre" component={Sobre} />
          <Route path="/historia" component={Sobre} />
          <Route path="/busca" component={Busca} />
          <Route path="/favoritos" component={Favoritos} />
          <Route path="/rastreio" component={Rastreio} />
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/admin/produtos" component={AdminProdutos} />
          <Route path="/admin/produtos/novo" component={AdminProdutoForm} />
          <Route path="/admin/produtos/:slug/editar" component={AdminProdutoForm} />
          <Route path="/admin/leads" component={AdminLeads} />
          <Route path="/admin/pedidos" component={AdminPedidos} />
          <Route path="/admin/pedidos/:codigo" component={AdminPedidoDetalhe} />
          <Route path="/admin/clientes" component={AdminClientes} />
          <Route path="/admin/emails" component={AdminEmails} />
          <Route path="/admin/categorias" component={AdminCategorias} />
          <Route path="/admin/financeiro" component={AdminFinanceiro} />
          <Route component={NaoEncontrada} />
        </Switch>
      </Suspense>

      {!ehAdmin && <BotaoWhatsApp />}
      {!ehAdmin && <MiniCarrinhoDrawer />}
    </CarrinhoProvider>
  );
}
