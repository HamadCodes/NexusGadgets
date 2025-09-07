// components/AppInitializer.tsx
"use client"

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useStore } from '@/stores/useStore';

export function AppInitializer() {
  const { data: session } = useSession();
  const { setFavoritesCount, setCartCount } = useStore();

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Fetch favorites count
        const favRes = await fetch('/api/user/favorites');
        if (favRes.ok) {
          const favData = await favRes.json();
          setFavoritesCount(favData.favorites?.length || 0);
        }

        // Fetch cart count
        const cartRes = await fetch('/api/user/cart');
        if (cartRes.ok) {
          const cartData = await cartRes.json();
          setCartCount(cartData.cart?.length || 0);
        }
      } catch (error) {
        console.error('Failed to initialize counts', error);
      }
    };

    fetchCounts();
  }, [session, setFavoritesCount, setCartCount]);

  return null;
}