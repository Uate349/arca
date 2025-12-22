import { useState } from 'react'

export interface CartItem {
  product_id: string
  name: string
  price: number
  quantity: number
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])

  function addToCart(item: CartItem) {
    setItems(prev => {
      const existing = prev.find(p => p.product_id === item.product_id)
      if (existing) {
        return prev.map(p => p.product_id === item.product_id ? { ...p, quantity: p.quantity + item.quantity } : p)
      }
      return [...prev, item]
    })
  }

  function removeFromCart(product_id: string) {
    setItems(prev => prev.filter(p => p.product_id !== product_id))
  }

  function clearCart() {
    setItems([])
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return { items, addToCart, removeFromCart, clearCart, total }
}
