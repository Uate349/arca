import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../store/cartStore";
import ArcaLogo from "../assets/arca-logo.png";

export default function Navbar() {
  const { items } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const count = useMemo(
    () => items.reduce((acc, it) => acc + (it.quantity || 0), 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity || 0), 0),
    [items]
  );

  const navLinks = [
    { to: "/", label: "Loja" },
    { to: "/cart", label: "Carrinho" },
    { to: "/account", label: "Conta" },
    { to: "/consultor", label: "Consultor" },
    { to: "/admin", label: "Admin" },
    { to: "/login", label: "Entrar" },
  ];

  return (
    <nav className="w-full flex items-center justify-between px-6 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-900/40 border-b border-emerald-500/30 shadow-lg shadow-emerald-500/10 relative">

      {/* Logo */}
      <Link to="/" className="flex items-center gap-3">
        <img src={ArcaLogo} alt="Arca" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
        <div className="flex flex-col leading-tight">
          <span className="text-xl sm:text-2xl font-extrabold tracking-wide text-emerald-300">ARCA</span>
          <span className="text-[11px] sm:text-xs uppercase text-emerald-400/80 font-medium">
            Fragrâncias & Recompensas
          </span>
        </div>
      </Link>

      {/* Links */}
      <div className="hidden sm:flex gap-4 text-xs sm:text-sm">
        {navLinks.map((link) => (
          <Link key={link.to} to={link.to} className="hover:text-emerald-300">
            {link.label}
          </Link>
        ))}
      </div>

      {/* Carrinho fixo no canto inferior direito */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          className="relative text-2xl text-emerald-300 focus:outline-none"
          onClick={() => setIsCartOpen(!isCartOpen)}
        >
          🛒
          {count > 0 && (
            <span className="absolute -top-2 -right-2 bg-emerald-500 text-slate-900 rounded-full text-[10px] w-5 h-5 flex items-center justify-center font-bold">
              {count}
            </span>
          )}
        </button>

        {/* Dropdown do carrinho */}
        {isCartOpen && (
          <div className="absolute bottom-full right-0 mb-2 w-80 max-w-[90vw] bg-slate-950/95 backdrop-blur border border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-sm font-semibold">Carrinho</span>
              <span className="text-xs text-slate-400">{count} item(ns)</span>
            </div>

            <div className="px-4 py-3 space-y-2 max-h-64 overflow-y-auto">
              {items.length === 0 && <div className="text-sm text-slate-400">Carrinho vazio</div>}
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

            <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between">
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
        )}
      </div>
    </nav>
  );
}