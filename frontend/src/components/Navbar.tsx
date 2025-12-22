import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="w-full flex items-center justify-between px-6 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-900/40 border-b border-emerald-500/30 shadow-lg shadow-emerald-500/10">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black">
          A
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-bold tracking-wide text-emerald-300">ARCA</span>
          <span className="text-[10px] uppercase text-emerald-500/80">Fragrâncias & Recompensas</span>
        </div>
      </Link>
      <div className="flex gap-4 text-xs sm:text-sm">
        <Link to="/" className="hover:text-emerald-300">Loja</Link>
        <Link to="/cart" className="hover:text-emerald-300">Carrinho</Link>
        <Link to="/account" className="hover:text-emerald-300">Conta</Link>
        <Link to="/consultor" className="hover:text-emerald-300">Consultor</Link>
        <Link to="/admin" className="hover:text-emerald-300">Admin</Link>
        <Link to="/login" className="hover:text-emerald-300">Entrar</Link>
      </div>
    </nav>
  )
}
