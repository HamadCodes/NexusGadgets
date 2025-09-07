// stores/useStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GlobalState {
  favoritesCount: number;
  cartCount: number;
  setFavoritesCount: (count: number) => void;
  setCartCount: (count: number) => void;
  incrementFavorites: () => void;
  decrementFavorites: () => void;
}

export const useStore = create<GlobalState>()(
  persist(
    (set) => ({
      favoritesCount: 0,
      cartCount: 0,
      setFavoritesCount: (count) => set({ favoritesCount: count }),
      setCartCount: (count) => set({ cartCount: count }),
      incrementFavorites: () => set((state) => ({ favoritesCount: state.favoritesCount + 1 })),
      decrementFavorites: () => set((state) => ({ 
        favoritesCount: Math.max(0, state.favoritesCount - 1) 
      })),
    }),
    {
      name: 'header-storage', // name of the item in the storage
    }
  )
);