import { useSession } from 'next-auth/react';
import { useState, useCallback, useEffect } from 'react';
import { useStore } from '@/stores/useStore';

// Helper functions for localStorage
const getLocalFavorites = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const favorites = localStorage.getItem('localFavorites');
    return favorites ? JSON.parse(favorites) : [];
  } catch {
    return [];
  }
};

const setLocalFavorites = (favorites: string[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('localFavorites', JSON.stringify(favorites));
};

const clearLocalFavorites = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('localFavorites');
};

export default function useFavorites() {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSynced, setHasSynced] = useState(false);
  const { setFavoritesCount, incrementFavorites, decrementFavorites } = useStore();

  // Update favorites count when favorites change
  useEffect(() => {
    setFavoritesCount(favorites.length);
  }, [favorites, setFavoritesCount]);

  // Fetch favorites from API on initialization
  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      const localFavorites = getLocalFavorites();
      setFavorites(localFavorites);
      setIsLoading(false);
      setInitialized(true);
      return localFavorites;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/user/favorites');
      if (!response.ok) throw new Error('Failed to fetch favorites');
      
      const data = await response.json();
      const favs = data.favorites || [];
      return favs;
    } catch (error) {
      console.error('Failed to load favorites', error);
      setErrors(prev => ({ ...prev, global: 'Failed to load favorites' }));
      return [];
    } finally {
      setIsLoading(false);
      setInitialized(true);
    }
  }, [isAuthenticated]);

  // Initialize favorites
  useEffect(() => {
    const initFavorites = async () => {
      const favs = await fetchFavorites();
      setFavorites(favs);
    };

    initFavorites();
  }, [fetchFavorites]);

  // Sync local favorites to server when user signs in
  useEffect(() => {
    const syncLocalFavoritesToServer = async () => {
      if (!isAuthenticated || hasSynced) return;
      
      const localFavorites = getLocalFavorites();
      if (localFavorites.length === 0) {
        setHasSynced(true);
        return;
      }
      
      try {
        // Get current server favorites to avoid duplicates
        const serverFavorites = await fetchFavorites();
        const serverFavoritesSet = new Set(serverFavorites);
        
        // Only sync items that aren't already on the server
        const itemsToSync = localFavorites.filter(id => !serverFavoritesSet.has(id));
        
        if (itemsToSync.length === 0) {
          clearLocalFavorites();
          setHasSynced(true);
          return;
        }

        // Add all local favorites to server
        const syncPromises = itemsToSync.map(async (productId) => {
          try {
            const response = await fetch('/api/user/favorites', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productId }),
            });
            
            if (!response.ok) {
              console.error(`Failed to sync favorite: ${productId}`);
              return { success: false, productId };
            }
            return { success: true, productId };
          } catch (error) {
            console.error(`Failed to sync favorite: ${productId}`, error);
            return { success: false, productId };
          }
        });

        await Promise.all(syncPromises);
        
        // Clear local favorites after successful sync
        clearLocalFavorites();
        setHasSynced(true);
        
        // IMPORTANT: Fetch the updated favorites from server after sync
        const updatedFavorites = await fetchFavorites();
        setFavorites(updatedFavorites);
      } catch (error) {
        console.error('Failed to sync local favorites to server', error);
      }
    };

    if (initialized && isAuthenticated) {
      syncLocalFavoritesToServer();
    }
  }, [isAuthenticated, initialized, fetchFavorites, hasSynced]);

  // Check if a product is favorited
  const isFavorite = useCallback((productId: string): boolean => {
    return favorites.includes(productId);
  }, [favorites]);

  // Add to favorites
  const addFavorite = useCallback(async (productId: string) => {
    setLoadingStates(prev => ({ ...prev, [productId]: true }));
    setErrors(prev => ({ ...prev, [productId]: '' }));
    
    try {
      if (isAuthenticated) {
        const response = await fetch('/api/user/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        });
        
        if (!response.ok) {
          throw new Error(response.status === 401 
            ? 'Please sign in to add favorites' 
            : 'Failed to add favorite');
        }
      }
      
      // Update local state regardless of authentication
      setFavorites(prev => {
        const newFavorites = [...prev, productId];
        if (!isAuthenticated) {
          setLocalFavorites(newFavorites);
        }
        return newFavorites;
      });
      
      // Update global state
      incrementFavorites();
    } catch (error: unknown) {
      let message = 'An error occurred';
      if (error instanceof Error) {
        message = error.message;
      }
      setErrors(prev => ({ 
        ...prev, 
        [productId]: message
      }));
      throw error;
    } finally {
      setLoadingStates(prev => ({ ...prev, [productId]: false }));
    }
  }, [isAuthenticated, incrementFavorites]);

  // Remove from favorites
  const removeFavorite = useCallback(async (productId: string) => {
    setLoadingStates(prev => ({ ...prev, [productId]: true }));
    setErrors(prev => ({ ...prev, [productId]: '' }));
    
    try {
      if (isAuthenticated) {
        const response = await fetch('/api/user/favorites', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to remove favorite');
        }
      }

      // Update local state regardless of authentication
      setFavorites(prev => {
        const newFavorites = prev.filter(id => id !== productId);
        if (!isAuthenticated) {
          setLocalFavorites(newFavorites);
        }
        return newFavorites;
      });
      
      // Update global state
      decrementFavorites();
    } catch (error: unknown) {
      let message = 'An error occurred';
      if (error instanceof Error) {
        message = error.message;
      }
      setErrors(prev => ({ 
        ...prev, 
        [productId]: message
      }));
      throw error;
    } finally {
      setLoadingStates(prev => ({ ...prev, [productId]: false }));
    }
  }, [isAuthenticated, decrementFavorites]);

  // Refresh favorites from API
  const refreshFavorites = useCallback(async () => {
    const favs = await fetchFavorites();
    setFavorites(favs);
  }, [fetchFavorites]);

  // Get loading state for a specific product
  const isLoadingItem = useCallback((productId: string) => {
    return loadingStates[productId] || false;
  }, [loadingStates]);

  // Get error for a specific product
  const getError = useCallback((productId: string) => {
    return errors[productId] || null;
  }, [errors]);

  return {
    favorites,
    isFavorite,
    addFavorite,
    removeFavorite,
    refreshFavorites,
    isLoading: isLoadingItem,
    getError,
    initialized,
    isLoadingFavorites: isLoading
  };
}