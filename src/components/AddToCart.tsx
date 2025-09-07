"use client"

import { useState, useEffect } from 'react';
import { Product } from '@/models/Product';
import useCart from '@/hooks/useCart';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CartItem {
  productId: string;
  color: { name: string; hexCode: string };
  storage?: { storage: string; price: number };
  quantity: number;
}

export default function AddToCart({ 
  product, 
  selectedColor,
  selectedStorage
}: { 
  product: Product;
  selectedColor: { name: string; hexCode: string };
  selectedStorage?: { storage: string; price: number };
}) {
  const [isAdded, setIsAdded] = useState(false);
  
  const {
    addToCart,
    refreshCart,
    isLoading,
    getError,
    initialized,
    isInCart
  } = useCart();
  
  const productId = product._id?.toString() || product.slug;
  
  // Create a unique identifier for this specific cart item configuration
  const cartItemId = `${productId}-${selectedColor.name}${selectedStorage ? `-${selectedStorage.storage}` : ''}`;
  
  const inCart = isInCart(cartItemId);
  const loading = isLoading(cartItemId);
  const outOfStock = product.stockCount <= 0;

  // Handle errors
  const error = getError(cartItemId);
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error, cartItemId, getError]);

  const handleAddToCart = async () => {
    try {
      const cartItem: CartItem = {
        productId,
        color: selectedColor,
        storage: selectedStorage,
        quantity: 1
      };
      
      await addToCart(cartItem, cartItemId);
      setIsAdded(true);
      
      // Refresh cart to ensure consistency
      await refreshCart();
      
      // Reset success state after 2 seconds
      setTimeout(() => setIsAdded(false), 2000);
    } catch {
      // Error is handled by toast in the effect above
    }
  };

  // Show skeleton loader while initializing
  if (!initialized) {
    return (
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          className="px-6 py-2 bg-gray-300 text-gray-500 rounded flex items-center justify-center gap-2"
          disabled
        >
          <Loader2 className="animate-spin h-5 w-5" />
          Loading...
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <button
        className={`px-6 py-2 rounded flex items-center justify-center gap-2 transition-all duration-200 ${
          outOfStock 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : isAdded
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
        } disabled:opacity-50`}
        onClick={handleAddToCart}
        disabled={loading || outOfStock}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin h-5 w-5" />
            Adding...
          </>
        ) : outOfStock ? (
          <>
            <ShoppingCart className="h-5 w-5" />
            Out of Stock
          </>
        ) : isAdded ? (
          <>
            <Check className="h-5 w-5" />
            Added!
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5" />
            Add to Cart
          </>
        )}
      </button>
      
      {/* Tooltip for in-cart indicator */}
      {inCart && !outOfStock && !isAdded && (
        <div className="flex items-center text-green-600 ml-2">
          <Check className="h-5 w-5 mr-1" />
          <span>In your cart</span>
        </div>
      )}
    </div>
  );
}