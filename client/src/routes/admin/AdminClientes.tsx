import { trpc } from "../../lib/trpc";
import AdminGuard from "./AdminGuard";
import AdminLayout from "./AdminLayout";
import { Card, EmptyState } from "./AdminUI";

function ListaClientes() {
  const { data: clientes = [], isLoading } = trpc.clientes.listar.useQuery();

  return (
    <AdminLayout titulo="Clientes">
      <p className="-mt-3 mb-6 text-sm text-[#5E6270]">
        Pessoas que já finalizaram pelo menos um pedido (diferente da lista da
        newsletter).
      </p>

      {isLoading && <p className="text-sm text-[#5E6270]">Carregando…</p>}

      {!isLoading && clientes.length === 0 && (
        <EmptyState>Nenhum pedido finalizado ainda.</EmptyState>
      )}

      {clientes.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-black/5 bg-black/[0.02] text-left text-xs uppercase tracking-wide text-[#5E6270]">
                <th className="px-5 py-3 font-medium">Nome</th>
                <th className="px-3 py-3 font-medium">E-mail</th>
                <th className="px-3 py-3 font-medium">Telefone</th>
                <th className="px-3 py-3 font-medium">Pedidos</th>
                <th className="px-3 py-3 font-medium">Total gasto</th>
                <th className="px-5 py-3 font-medium">Último pedido</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.email} className="border-b border-black/5 last:border-0 hover:bg-black/[0.015]">
                  <td className="px-5 py-3 font-medium text-[#16181F]">{c.nome}</td>
                  <td className="px-3 py-3 text-[#6b6459]">{c.email}</td>
                  <td className="px-3 py-3 text-[#6b6459]">{c.telefone}</td>
                  <td className="px-3 py-3 text-[#6b6459]">{c.totalPedidos}</td>
                  <td className="px-3 py-3 text-[#6b6459]">
                    R$ {Number(c.totalGasto).toFixed(2).replace(".", ",")}
                  </td>
                  <td className="px-5 py-3 text-[#6b6459]">
                    {new Date(c.ultimoPedidoEm).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </AdminLayout>
  );
}

export default function AdminClientes() {
  return (
    <AdminGuard>
      <ListaClientes />
    </AdminGuard>
  );
}
