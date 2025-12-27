import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import AccountPage from './pages/AccountPage'
import ConsultantDashboardPage from './pages/ConsultantDashboardPage'

// ✅ Preview do carrinho (novo)
import CartPreviewSticky from './components/CartPreviewSticky'

// ✅ Admin (novo caminho + novas páginas)
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminProductsPage from './pages/admin/AdminProductsPage'
import AdminPayoutsPage from './pages/admin/AdminPayoutsPage'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/consultor" element={<ConsultantDashboardPage />} />

          {/* ✅ Admin */}
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/payouts" element={<AdminPayoutsPage />} />
        </Routes>
      </main>

      {/* ✅ Carrinho preview sticky (aparece só quando tem itens) */}
      <CartPreviewSticky />
    </div>
  )
}