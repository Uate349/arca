import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useCart } from "../store/cartStore";

export default function CartPreviewSticky() {
  const { items } = useCart();

  // Quantidade total de itens no carrinho
  const count = useMemo(
    () => items.reduce((acc, it) => acc + (it.quantity || 0), 0),
    [items]
  );

  // Subtotal total
  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity || 0), 0),
    [items]
  );

  // Não renderiza nada se o carrinho estiver vazio
  if (!items || items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[92vw] flex flex-col bg-slate-950/95 backdrop-blur border border-slate-800 rounded-2xl shadow-xl overflow-hidden">

      {/* Cabeçalho */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="text-sm font-semibold">
          Carrinho <span className="text-slate-400 font-normal">• {count} item(ns)</span>
        </div>
        <Link to="/cart" className="text-xs text-emerald-400 hover:text-emerald-300">
          Abrir
        </Link>
      </div>

      {/* Lista de itens com tamanho fixo e scroll */}
      <div className="px-4 py-3 space-y-2 overflow-y-auto max-h-[280px]">
        {items.map((it) => (
          <div key={it.product_id} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{it.name}</div>
              <div className="text-xs text-slate-400">
                {Number(it.price).toFixed(2)} MT × {it.quantity}
              </div>
            </div>
            <div className="text-sm font-semibold text-slate-200 shrink-0">
              {(Number(it.price) * Number(it.quantity)).toFixed(2)} MT
            </div>
          </div>
        ))}
      </div>

      {/* Rodapé com subtotal e botão Pagar */}
      <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400">Subtotal</div>
          <div className="text-base font-bold text-emerald-400">
            {Number(subtotal).toFixed(2)} MT
          </div>
        </div>
        <Link
          to="/cart"
          className="px-3 py-2 rounded-xl bg-emerald-500 text-slate-900 text-sm font-semibold hover:bg-emerald-400"
        >
          Pagar
        </Link>
      </div>
    </div>
  );
}