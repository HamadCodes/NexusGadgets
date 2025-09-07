import { useState, useCallback, useEffect } from 'react';
import { useStore } from '@/stores/useStore';
import { useSession } from 'next-auth/react';

export interface CartItem {
  productId: string;
  color: { name: string; hexCode: string };
  storage?: { storage: string; price: number };
  quantity: number;
}

// Helper functions for localStorage
const getLocalCart = (): Record<string, CartItem> => {
  if (typeof window === 'undefined') return {};
  try {
    const cart = localStorage.getItem('localCart');
    return cart ? JSON.parse(cart) : {};
  } catch {
    return {};
  }
};

const setLocalCart = (cart: Record<string, CartItem>) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('localCart', JSON.stringify(cart));
};

const clearLocalCart = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('localCart');
};

export default function useCart() {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSynced, setHasSynced] = useState(false);
  const { setCartCount } = useStore();

  // Use effect to sync cart count
  useEffect(() => {
    setCartCount(Object.keys(cart).length);
  }, [cart, setCartCount]);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      const localCart = getLocalCart();
      setCart(localCart);
      setIsLoading(false);
      setInitialized(true);
      return localCart;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/user/cart');
      if (!response.ok) throw new Error('Failed to fetch cart');
      
      const data = await response.json();
      const cartItems = data.cart || [];
      
      // Convert array to object with keys
      const cartObject = cartItems.reduce((acc: Record<string, CartItem>, item: CartItem) => {
        const key = `${item.productId}-${item.color.name}${item.storage ? `-${item.storage.storage}` : ''}`;
        acc[key] = item;
        return acc;
      }, {});
      
      setCart(cartObject);
      return cartObject;
    } catch (error) {
      console.error('Failed to load cart', error);
      setErrors(prev => ({ ...prev, global: 'Failed to load cart' }));
      return {};
    } finally {
      setIsLoading(false);
      setInitialized(true);
    }
  }, [isAuthenticated]);

  // Sync local cart to server when user signs in
  useEffect(() => {
    const syncLocalCartToServer = async () => {
      if (!isAuthenticated || hasSynced) return;
      
      const localCart = getLocalCart();
      if (Object.keys(localCart).length === 0) {
        setHasSynced(true);
        return;
      }
      
      try {
        // Merge local cart with server cart
        const response = await fetch('/api/user/cart/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: Object.values(localCart) }),
        });
        
        if (response.ok) {
          // Clear local cart after successful sync
          clearLocalCart();
          setHasSynced(true);
          // Refresh the cart from server
          await fetchCart();
        }
      } catch (error) {
        console.error('Failed to sync local cart to server', error);
      }
    };

    if (initialized && isAuthenticated) {
      syncLocalCartToServer();
    }
  }, [isAuthenticated, initialized, fetchCart, hasSynced]);

  useEffect(() => {
    const initCart = async () => {
      await fetchCart();
    };

    initCart();
  }, [fetchCart]);

  const addToCart = useCallback(async (item: CartItem, itemId: string) => {
    setLoadingStates(prev => ({ ...prev, [itemId]: true }));
    setErrors(prev => ({ ...prev, [itemId]: '' }));
    
    try {
      if (isAuthenticated) {
        const response = await fetch('/api/user/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        
        if (!response.ok) {
          throw new Error(response.status === 401 
            ? 'Please sign in to add to cart' 
            : 'Failed to add to cart');
        }
      }
      
      // Update local state regardless of authentication
      setCart(prev => {
        const newCart = { ...prev, [itemId]: item };
        if (!isAuthenticated) {
          setLocalCart(newCart);
        }
        return newCart;
      });
    } catch (error: unknown) {
      let message = 'An error occurred';
      if (error instanceof Error) {
        message = error.message;
      }
      setErrors(prev => ({ 
        ...prev, 
        [itemId]: message
      }));
      throw error;
    } finally {
      setLoadingStates(prev => ({ ...prev, [itemId]: false }));
    }
  }, [isAuthenticated]);

  const removeFromCart = useCallback(async (itemId: string) => {
    setLoadingStates(prev => ({ ...prev, [itemId]: true }));
    setErrors(prev => ({ ...prev, [itemId]: '' }));
    
    try {
      if (isAuthenticated) {
        // Get cart item to send to API
        const item = cart[itemId];
        
        const response = await fetch('/api/user/cart', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        
        if (!response.ok) {
          throw new Error('Failed to remove from cart');
        }
      }

      // Update local state regardless of authentication
      setCart(prev => {
        const newCart = { ...prev };
        delete newCart[itemId];
        if (!isAuthenticated) {
          setLocalCart(newCart);
        }
        return newCart;
      });
    } catch (error: unknown) {
      let message = 'An error occurred';
      if (error instanceof Error) {
        message = error.message;
      }
      setErrors(prev => ({ 
        ...prev, 
        [itemId]: message
      }));
      throw error;
    } finally {
      setLoadingStates(prev => ({ ...prev, [itemId]: false }));
    }
  }, [cart, isAuthenticated]);

  const updateQuantity = useCallback(async (key: string, newQuantity: number) => {
    const item = cart[key];
    if (!item) return;

    setLoadingStates(prev => ({ ...prev, [key]: true }));
    setErrors(prev => ({ ...prev, [key]: '' }));

    try {
      if (isAuthenticated) {
        const updatedItem = { ...item, quantity: newQuantity };
        
        const response = await fetch('/api/user/cart', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedItem),
        });
        
        if (!response.ok) throw new Error('Failed to update quantity');
      }

      // Update local state regardless of authentication
      setCart(prev => {
        const updatedItem = { ...item, quantity: newQuantity };
        const newCart = { ...prev, [key]: updatedItem };
        if (!isAuthenticated) {
          setLocalCart(newCart);
        }
        return newCart;
      });
    } catch (error: unknown) {
      let message = 'Update failed';
      if (error instanceof Error) {
        message = error.message;
      }
      setErrors(prev => ({ ...prev, [key]: message }));
      throw error;
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  }, [cart, isAuthenticated]);

  const incrementQuantity = useCallback(async (key: string) => {
    const current = cart[key]?.quantity || 0;
    await updateQuantity(key, current + 1);
  }, [cart, updateQuantity]);

  const decrementQuantity = useCallback(async (key: string) => {
    const current = cart[key]?.quantity || 0;
    if (current <= 1) {
      await removeFromCart(key);
    } else {
      await updateQuantity(key, current - 1);
    }
  }, [cart, removeFromCart, updateQuantity]);

  const refreshCart = useCallback(async () => {
    await fetchCart();
  }, [fetchCart]);

  const isInCart = useCallback((itemId: string) => {
    return cart.hasOwnProperty(itemId);
  }, [cart]);

  const isLoadingItem = useCallback((itemId: string) => {
    return loadingStates[itemId] || false;
  }, [loadingStates]);

  const getError = useCallback((itemId: string) => {
    return errors[itemId] || null;
  }, [errors]);

  return {
    cart,
    addToCart,
    removeFromCart,
    refreshCart,
    incrementQuantity,
    decrementQuantity,
    isInCart,
    isLoading: isLoadingItem,
    getError,
    initialized,
    isLoadingCart: isLoading,
    cartCount: Object.keys(cart).length
  };
}