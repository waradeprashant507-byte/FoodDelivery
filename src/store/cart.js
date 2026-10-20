import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCart = create(
  persist(
    (set, get) => ({
      restaurant: null,
      items: [], 
      add: (restaurant, item) => {
        const { restaurant: current, items } = get();
        const base = current && current.id !== restaurant.id ? [] : items;
        const found = base.find((i) => i.id === item.id);
        const next = found
          ? base.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
          : [...base, { id: item.id, name: item.name, price: item.price, image: item.image, quantity: 1 }];
        set({
          restaurant: { id: restaurant.id, name: restaurant.name, location: restaurant.location || null },
          items: next,
        });
      },
      dec: (id) => {
        const items = get()
          .items.map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i))
          .filter((i) => i.quantity > 0);
        set({ items, restaurant: items.length ? get().restaurant : null });
      },
      remove: (id) => {
        const items = get().items.filter((i) => i.id !== id);
        set({ items, restaurant: items.length ? get().restaurant : null });
      },
      clear: () => set({ items: [], restaurant: null }),
      total: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
    }),
    { name: 'cart-v3' }
  )
);
