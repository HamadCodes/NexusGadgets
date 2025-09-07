'use client'

import { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { ShoppingCart } from 'lucide-react'
import useCart from '@/hooks/useCart'
import { Product } from '@/models/Product'
import { useStore } from '@/stores/useStore'
import Image from 'next/image'

interface CartItem {
  productId: string
  color: { name: string; hexCode: string }
  storage?: { storage: string; price: number }
  quantity: number
}

type CartProductBase = {
  id: string
  name: string
  imageUrls: string[]
  price: number
  slug: string
  colors: { name: string; hexCode: string }[]
  category: Product['category']
  storageOptions?: { storage: string; price: number }[]
  originalPrice?: number
  discountPercentage?: number
}

type CartProduct = CartProductBase & { cartItem: CartItem }

const CartPage: NextPage = () => {
  const { status } = useSession()
  const { 
    cart, 
    removeFromCart, 
    refreshCart,
    incrementQuantity,
    decrementQuantity,
    isLoading: isCartItemLoading,
    initialized,
    isLoadingCart
  } = useCart()
  const { setCartCount } = useStore()

  const [cartItems, setCartItems]       = useState<CartItem[]>([])
  const [products, setProducts]         = useState<CartProduct[] | null>(null)
  const [loading, setLoading]           = useState(false)
  const lastFetchedIds = useRef<string[]>([])

  // 1) sync cart items + count
  useEffect(() => {
    const items = Object.values(cart)
    setCartItems(items)
    setCartCount(items.length)
  }, [cart, setCartCount])

  // 2) fetch product details
  useEffect(() => {
    if (!initialized || isLoadingCart) {
      setProducts(null)
      lastFetchedIds.current = []
      return
    }
    
    if (cartItems.length === 0) {
      setProducts([])
      lastFetchedIds.current = []
      return
    }
    
    const ids = Array.from(new Set(cartItems.map(i => i.productId))).sort()
    const same = ids.length === lastFetchedIds.current.length && ids.every((id, i) => id === lastFetchedIds.current[i])
    if (same) return

    setLoading(true)
    ;(async () => {
      try {
        const res = await fetch('/api/products/batch', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        })
        if (!res.ok) throw new Error(await res.text())
        const data: CartProductBase[] = await res.json()
        const merged = cartItems
          .map(item => {
            const p = data.find(d => d.id === item.productId)
            return p ? ({ ...p, cartItem: item } as CartProduct) : null
          })
          .filter(Boolean) as CartProduct[]
        setProducts(merged)
        lastFetchedIds.current = ids
      } catch (err) {
        console.error('Failed to load cart items', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [cartItems, initialized, isLoadingCart])

  // 3) remove handler
  const handleRemove = async (key: string) => {
    try {
      await removeFromCart(key)
      // Refresh UI immediately after removal
      setProducts(prev => prev?.filter(p => {
        const itemKey = `${p.id}-${p.cartItem.color.name}${p.cartItem.storage ? `-${p.cartItem.storage.storage}` : ''}`
        return itemKey !== key
      }) || null)
    } catch {
      refreshCart()
    }
  }

  // Handle quantity updates in UI immediately
  const handleQuantityChange = (key: string, newQuantity: number) => {
    setProducts(prev => {
      if (!prev) return prev
      
      return prev.map(p => {
        const itemKey = `${p.id}-${p.cartItem.color.name}${p.cartItem.storage ? `-${p.cartItem.storage.storage}` : ''}`
        if (itemKey === key) {
          return {
            ...p,
            cartItem: {
              ...p.cartItem,
              quantity: newQuantity
            }
          }
        }
        return p
      })
    })
  }

  // total
  const total = (products ?? []).reduce(
    (sum, p) => sum + (p.price + (p.cartItem.storage?.price || 0)) * p.cartItem.quantity, 
    0
  )

  // show spinner while session or init
  const pageLoading = status === 'loading' || !initialized || isLoadingCart
  const notAuthed  = status === 'unauthenticated'
  const showLoader = loading || (products === null && initialized)
  const showEmpty  = products !== null && products.length === 0

  return (
    <>
      <Head><title>Your Cart</title></Head>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>

        {pageLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-16 w-16 text-gray-400 mb-4 animate-pulse" />
            <p>Loading your cart...</p>
          </div>
        ) : showLoader ? (
          <div className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-16 w-16 text-gray-400 mb-4 animate-pulse" />
            <p>Loading your cart items...</p>
          </div>
        ) : showEmpty ? (
          <div className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-lg mb-4">Your cart is empty</p>
            <Link href="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Continue shopping</Link>
          </div>
        ) : (
          <div>
            {notAuthed && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
                <p className="font-bold">Guest Cart</p>
                <p>Sign in to save your cart across devices and proceed to checkout.</p>
                <Link href="/auth/signin" className="text-blue-600 underline mt-2 inline-block">Sign in</Link>
              </div>
            )}
          <div className="flex flex-col space-y-4 min-h-[400px] justify-between">
            
            <div className='flex flex-col gap-2'>
              {products?.map(prod => {
                const { cartItem } = prod
                const key = `${prod.id}-${cartItem.color.name}${cartItem.storage?`-${cartItem.storage.storage}`:''}`
                const price = prod.price + (cartItem.storage?.price || 0)
                const itemTotal = price * cartItem.quantity
                const itemLoading = isCartItemLoading(key)
                
                return (
                  <div key={key} className="flex flex-col md:flex-row items-center justify-between p-4 border rounded-lg gap-4">
                    <Link href={`/products/${prod.slug}`} className="flex items-center flex-1 min-w-0">
                      <Image
                        src={prod.imageUrls[0]}
                        alt={prod.name}
                        width={80}
                        height={80}
                        className="w-20 h-20 object-contain rounded-md mr-4"
                        style={{ width: '80px', height: '80px' }}
                        unoptimized={false}
                        priority
                      />
                      <div className="min-w-0">
                        <h2 className="text-lg font-medium truncate">{prod.name}</h2>
                        <div className="flex items-center mt-1">
                          <div className="w-4 h-4 rounded-full border border-gray-400 mr-2" style={{ backgroundColor: cartItem.color.hexCode }} title={cartItem.color.name} />
                          <span className="text-sm">{cartItem.color.name}</span>
                        </div>
                        {cartItem.storage && <p className="text-sm mt-1">Storage: {cartItem.storage.storage} (+${cartItem.storage.price.toFixed(2)})</p>}
                      </div>
                    </Link>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <div className="flex items-center border rounded-lg overflow-hidden">
                        <button 
                          onClick={async () => {
                            const currentQty = cartItem.quantity
                            handleQuantityChange(key, currentQty - 1)
                            await decrementQuantity(key)
                          }}
                          disabled={itemLoading}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          -
                        </button>
                        <span className="px-4 py-1 bg-white">
                          {cartItem.quantity}
                        </span>
                        <button 
                          onClick={async () => {
                            const currentQty = cartItem.quantity
                            handleQuantityChange(key, currentQty + 1)
                            await incrementQuantity(key)
                          }}
                          disabled={itemLoading}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                      
                      <p className="text-lg font-semibold">${itemTotal.toFixed(2)}</p>
                      
                      <button 
                        onClick={() => handleRemove(key)} 
                        disabled={itemLoading}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  
                )
              })}
            </div>
            </div>
            <div>
              <div className="mt-6 p-4 border-t flex justify-between items-center">
                <span className="text-xl font-semibold">Total:</span><span className="text-xl font-bold">${total.toFixed(2)}</span>
              </div>
              <div className="text-right mt-4">
                {notAuthed ? (
                  <Link href="/api/auth/signin" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Sign in to Checkout
                  </Link>
                ) : (
                  <Link href="/checkout" className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600">
                    Proceed to Checkout
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default CartPage