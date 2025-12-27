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

  // ✅ NOVO: diminuir 1 sem zerar de imediato
  decrementFromCart: (product_id: string) => void;

  // ✅ NOVO (opcional): setar quantidade exata
  setQuantity: (product_id: string, quantity: number) => void;

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

          const addQty = item.quantity || 1;

          if (existing) {
            return {
              items: state.items.map((p) =>
                p.product_id === item.product_id
                  ? { ...p, quantity: p.quantity + addQty }
                  : p
              ),
            };
          }

          return {
            items: [...state.items, { ...item, quantity: addQty }],
          };
        });
      },

      removeFromCart: (product_id) => {
        set((state) => ({
          items: state.items.filter((p) => p.product_id !== product_id),
        }));
      },

      // ✅ DIMINUIR 1: 5->4->3->2->1->remove
      decrementFromCart: (product_id) => {
        set((state) => {
          const existing = state.items.find((p) => p.product_id === product_id);
          if (!existing) return state;

          if (existing.quantity <= 1) {
            return { items: state.items.filter((p) => p.product_id !== product_id) };
          }

          return {
            items: state.items.map((p) =>
              p.product_id === product_id ? { ...p, quantity: p.quantity - 1 } : p
            ),
          };
        });
      },

      // ✅ SETAR QUANTIDADE EXATA
      setQuantity: (product_id, quantity) => {
        const q = Number(quantity);
        set((state) => {
          if (!Number.isFinite(q) || q <= 0) {
            return { items: state.items.filter((p) => p.product_id !== product_id) };
          }

          return {
            items: state.items.map((p) =>
              p.product_id === product_id ? { ...p, quantity: q } : p
            ),
          };
        });
      },

      clearCart: () => set({ items: [] }),

      get total() {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      },
    }),
    {
      name: "arca_cart",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);