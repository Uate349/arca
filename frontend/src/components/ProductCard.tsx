import { CartItem } from '../store/cartStore'

interface Props {
  product: any
  onAddToCart: (item: CartItem) => void
}

export default function ProductCard({ product, onAddToCart }: Props) {
  return (
    <div className="bg-slate-900 rounded-xl p-4 flex flex-col gap-3 border border-slate-800">
      {product.image_url && (
        <img src={product.image_url} alt={product.name} className="w-full h-40 object-cover rounded-lg" />
      )}
      <div className="flex-1">
        <h3 className="font-semibold text-lg">{product.name}</h3>
        <p className="text-xs text-slate-400 line-clamp-2">{product.description}</p>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-bold text-emerald-400">{Number(product.price).toFixed(2)} MT</span>
        <button
          onClick={() =>
            onAddToCart({
              product_id: product.id,
              name: product.name,
              price: Number(product.price),
              quantity: 1,
            })
          }
          className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-900 text-xs font-semibold hover:bg-emerald-400"
        >
          Adicionar
        </button>
      </div>
    </div>
  )
}
