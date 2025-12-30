import { useState } from "react";
import { Link } from "react-router-dom";
import ArcaLogo from "../assets/arca-logo.png";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "Loja" },
    { to: "/cart", label: "Carrinho" },
    { to: "/account", label: "Conta" },
    { to: "/consultor", label: "Consultor" },
    { to: "/admin", label: "Admin" },
    { to: "/login", label: "Entrar" },
  ];

  return (
    <nav className="w-full flex flex-col sm:flex-row sm:items-center justify-between px-6 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-900/40 border-b border-emerald-500/30 shadow-lg shadow-emerald-500/10">
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

      {/* Botão hamburguer para mobile */}
      <button
        className="sm:hidden mt-2 text-emerald-300 text-2xl focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "✕" : "☰"}
      </button>

      {/* Links */}
      <div className={`flex flex-col sm:flex-row sm:items-center gap-4 text-xs sm:text-sm mt-2 sm:mt-0 ${isOpen ? "flex" : "hidden sm:flex"}`}>
        {navLinks.map((link) => (
          <Link key={link.to} to={link.to} className="hover:text-emerald-300" onClick={() => setIsOpen(false)}>
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}