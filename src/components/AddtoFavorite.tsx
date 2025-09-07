"use client"

import { useState, useEffect } from 'react';
import { Product } from '@/models/Product';
import useFavorites from '@/hooks/useFavorites';
import { Heart } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function FavoriteButton({ product }: { product: Product }) {
  const productId = product._id?.toString() || product.slug;
  const { 
    isFavorite, 
    addFavorite, 
    removeFavorite,
    refreshFavorites,
    isLoading,
    getError,
    initialized
  } = useFavorites();
  
  const [isHovered, setIsHovered] = useState(false);
  const isFavorited = isFavorite(productId);
  const loading = isLoading(productId);

  // Handle errors
  useEffect(() => {
    const error = getError(productId);
    if (error) {
      toast.error(error);
    }
  }, [getError, productId]);

  const handleToggleFavorite = async () => {
    try {
      if (isFavorited) {
        await removeFavorite(productId);
      } else {
        await addFavorite(productId);
      }
      // Refresh favorites to ensure consistency
      await refreshFavorites();
    } catch {
      toast.error('Failed to update favorite');
    }
  };

  // Show skeleton loader while initializing
  if (!initialized) {
    return (
      <div className="p-2">
        <Heart size={24} className="text-gray-300 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="relative group">
      <button
        onClick={handleToggleFavorite}
        disabled={loading}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500"
        aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {loading ? (
          <Heart 
            size={24} 
            className="animate-pulse text-gray-400" 
            strokeWidth={1.5}
          />
        ) : (
          <Heart
            size={24}
            fill={
              isFavorited ? 
                (isHovered ? "transparent" : "red") : 
                "none"
            }
            stroke={
              isFavorited ? 
                (isHovered ? "#ef4444" : "red") : 
                "currentColor"
            }
            strokeWidth={1.5}
            className="transition-all duration-200"
          />
        )}
      </button>
      
      {/* Tooltip */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {isFavorited ? "Remove favorite" : "Add to favorites"}
      </div>
    </div>
  );
}