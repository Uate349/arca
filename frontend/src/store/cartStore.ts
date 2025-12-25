import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (product_id: string) => void;
  clearCart: () => void;
  total: number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (item) => {
        set((state) => {
          const existing = state.items.find((p) => p.product_id === item.product_id);
          if (existing) {
            return {
              items: state.items.map((p) =>
                p.product_id === item.product_id
                  ? { ...p, quantity: p.quantity + (item.quantity || 1) }
                  : p
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: item.quantity || 1 }] };
        });
      },

      removeFromCart: (product_id) => {
        set((state) => ({
          items: state.items.filter((p) => p.product_id !== product_id),
        }));
      },

      clearCart: () => set({ items: [] }),

      get total() {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      },
    }),
    {
      name: "arca_cart", // ✅ agora vai aparecer no Local Storage
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);