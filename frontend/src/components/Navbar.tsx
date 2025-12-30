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
    <nav className="w-full bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-900/40 border-b border-emerald-500/30 shadow-lg shadow-emerald-500/10 px-6 py-3 flex items-center justify-between relative">

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

      {/* Links Desktop */}
      <div className="hidden sm:flex gap-4 text-xs sm:text-sm">
        {navLinks.map((link) => (
          <Link key={link.to} to={link.to} className="hover:text-emerald-300">
            {link.label}
          </Link>
        ))}
      </div>

      {/* Botão hamburguer Mobile */}
      <div className="sm:hidden">
        <button
          className="text-2xl text-emerald-300 focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Menu dropdown Mobile */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-40 bg-slate-900/90 backdrop-blur-sm rounded-md shadow-lg flex flex-col p-2 sm:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="py-1 px-2 hover:text-emerald-300"
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}

    </nav>
  );
}