import { useEffect, useState } from "react"
import { fetchProducts } from "../api/productsApi"
import ProductCard from "../components/ProductCard"
import { useCart } from "../store/cartStore"

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([])
  const { addToCart } = useCart()

  useEffect(() => {
    fetchProducts().then(setProducts).catch(console.error)
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Loja ARCA</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} onAddToCart={addToCart} />
        ))}
      </div>
    </div>
  )
}