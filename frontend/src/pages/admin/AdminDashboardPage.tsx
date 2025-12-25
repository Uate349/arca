import { Link } from 'react-router-dom'

export default function AdminDashboardPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold">Painel administrativo ARCA</h1>
      <p className="text-sm text-slate-400">
        Aqui você gerencia produtos, pedidos, consultores, comissões e payouts.
      </p>

      <div className="grid md:grid-cols-3 gap-4 text-sm">
        <Link
          to="/admin/orders"
          className="block bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700"
        >
          <div className="text-xs text-slate-400 mb-1">Pedidos</div>
          <div>Ver pedidos, status, totais e descontos em pontos.</div>
        </Link>

        <Link
          to="/admin/products"
          className="block bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700"
        >
          <div className="text-xs text-slate-400 mb-1">Gestão de produtos</div>
          <div>Criar, editar, ativar/desativar e ajustar stock.</div>
        </Link>

        <Link
          to="/admin/payouts"
          className="block bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700"
        >
          <div className="text-xs text-slate-400 mb-1">Payouts</div>
          <div>Consultar payouts gerados e histórico.</div>
        </Link>
      </div>
    </div>
  )
}