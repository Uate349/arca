export default function AdminDashboardPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold">Painel administrativo ARCA</h1>
      <p className="text-sm text-slate-400">
        Aqui você futuramente gerencia produtos, stock, consultores, comissões e payouts.
        O backend já expõe endpoints de produtos, pedidos, comissões e payouts para integrar.
      </p>
      <div className="grid md:grid-cols-3 gap-4 text-sm">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Gestão de produtos</div>
          <div>Utilize o endpoint /products para criar, editar e desativar produtos.</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Gestão de payouts</div>
          <div>O job automático gera payouts a cada 30 dias; consulte via /payouts.</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Integrações de pagamento</div>
          <div>
            A estrutura em /payments_service está pronta para receber integração real M-Pesa/Emola/Banco.
          </div>
        </div>
      </div>
    </div>
  )
}
