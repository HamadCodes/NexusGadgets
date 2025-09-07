'use client'

import { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Heart, AlertCircle} from 'lucide-react'
import useFavorites from '@/hooks/useFavorites'
import { Product } from '@/models/Product'
import Image from 'next/image'

interface FavoritesProduct extends Omit<Product, '_id'> { id: string }

const FavoritesPage: NextPage = () => {
  const { status } = useSession()
  const { favorites, removeFavorite, initialized, isLoadingFavorites } = useFavorites()

  const [products, setProducts] = useState<FavoritesProduct[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastFetchedIds = useRef<string[]>([])

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      if (!initialized) {
        setProducts(null);
        lastFetchedIds.current = [];
        return;
      }
      
      if (favorites.length === 0) {
        setProducts([]);
        lastFetchedIds.current = [];
        return;
      }
      
      const ids = Array.from(new Set(favorites)).sort();
      const same = ids.length === lastFetchedIds.current.length && 
                  ids.every((id, i) => id === lastFetchedIds.current[i]);
      
      if (same) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const res = await fetch('/api/products/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids })
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || 'Failed to load favorites');
        }
        
        const data: FavoritesProduct[] = await res.json();
        setProducts(data);
        lastFetchedIds.current = ids;
      } catch (err) {
        console.error('Failed to load favorites products', err);
        setError(
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message?: unknown }).message)
            : 'Failed to load favorites. Please try again.'
        );
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [favorites, initialized]);

  const handleRemove = async (productId: string) => {
    const before = products ?? [];
    try {
      setProducts(prev => prev?.filter(p => p.id !== productId) || []);
      await removeFavorite(productId);
    } catch (err) {
      console.error('Failed to remove favorite', err);
      setProducts(before);
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : 'Failed to remove favorite. Please try again.'
      );
    }
  };

  const pageLoading = status === 'loading' || !initialized || isLoadingFavorites;
  const notAuthed = status === 'unauthenticated';
  const showLoader = loading || (products === null && initialized);
  const showEmpty = products !== null && products.length === 0 && !isLoadingFavorites;

  return (
    <>
      <Head><title>Your Favorites</title></Head>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Favorite Products</h1>
          <div className="flex items-center gap-4">
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}


        {isLoadingFavorites ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Heart className="h-16 w-16 text-gray-400 mb-4 animate-pulse" />
            <p>Syncing</p>
          </div>
        ) : pageLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Heart className="h-16 w-16 text-gray-400 mb-4 animate-pulse" />
            <p>Loading</p>
          </div>
        ) : showLoader ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Heart className="h-16 w-16 text-gray-400 mb-4 animate-pulse" />
            <p>Loading</p>
          </div>
        ) : showEmpty ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Heart className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-lg mb-4">Your favorites are empty</p>
            <Link href="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Find products to love</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {notAuthed && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
                <p className="font-bold">Guest Favorites</p>
                <p>Sign in to save your favorites across devices.</p>
                <Link href="/api/auth/signin" className="text-blue-600 underline mt-2 inline-block">Sign in</Link>
              </div>
            )}
            
            {products?.map(product => (
              <div key={product.id} className="flex flex-col md:flex-row items-center justify-between p-4 border rounded-lg gap-4">
                <Link href={`/products/${product.slug}`} className="flex items-center flex-1 min-w-0">
                  <Image
                    src={product.imageUrls[0] || '/images/placeholder-product.png'}
                    alt={product.name}
                    width={80}
                    height={80}
                    className="w-20 h-20 object-contain rounded-md mr-4"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/placeholder-product.png';
                    }}
                  />
                  <div className="min-w-0">
                    <h2 className="text-lg font-medium truncate">{product.name}</h2>
                    <div className="flex items-center mt-1">
                      <p className="text-gray-600">${product.price.toFixed(2)}</p>
                      {product.originalPrice && (
                        <span className="ml-2 text-sm text-gray-500 line-through">${product.originalPrice.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </Link>
                <button 
                  onClick={() => handleRemove(product.id)} 
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 whitespace-nowrap transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default FavoritesPage