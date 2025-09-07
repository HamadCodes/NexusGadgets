// components/LatestProductsByCategory.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ValidCategory, Product } from '@/models/Product';
import { Star } from 'lucide-react';

const CATEGORIES: ValidCategory[] = [
  'phones',
  'laptops',
  'smartwatches',
  'cameras',
  'headphones',
  'consoles'
];

export default function LatestProductsByCategory() {
  const [productsByCategory, setProductsByCategory] = useState<Record<ValidCategory, Product[]>>(
    {} as Record<ValidCategory, Product[]>
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestProducts = async () => {
      try {
        setLoading(true);
        const results = await Promise.all(
          CATEGORIES.map(category => 
            fetch(`/api/products?category=${category}&limit=4`)
              .then(res => res.json())
              .then(data => ({ category, products: data.products }))
        ));

        const groupedProducts = results.reduce((acc, { category, products }) => {
          acc[category] = products;
          return acc;
        }, {} as Record<ValidCategory, Product[]>);

        setProductsByCategory(groupedProducts);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLatestProducts();
  }, []);

  // Format category names for display
  const formatCategoryName = (category: ValidCategory) => {
    const names: Record<ValidCategory, string> = {
      phones: 'Phones',
      laptops: 'Laptops',
      smartwatches: 'Smartwatches',
      cameras: 'Cameras',
      headphones: 'Headphones',
      consoles: 'Gaming Consoles'
    };
    return names[category];
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="bg-red-50 text-red-700 p-6 rounded-lg inline-block">
          <h3 className="text-lg font-medium mb-2">Error Loading Products</h3>
          <p>{error}</p>
          <Button 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-20 max-xl:px-4 py-12">
      <h2 className="text-3xl font-bold mb-12 text-center">Latest Products</h2>
      
      <div className="space-y-16">
        {CATEGORIES.map(category => (
          <div key={category} className="category-section">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{formatCategoryName(category)}</h3>
              <Link href={`/categories/${category}`}>
                <Button variant="link" className="text-blue-600">
                  View All
                </Button>
              </Link>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i} 
                    className="group bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md border border-gray-100 flex flex-col h-full"
                  >
                    {/* Image skeleton */}
                    <div className="relative flex items-center justify-center" style={{ paddingTop: '100%' }}>
                      <Skeleton className="absolute inset-0 w-full h-full bg-gray-200" />
                    </div>
                    
                    <div className="p-4 flex flex-col flex-grow">
                      <Skeleton className="h-6 w-3/4 mb-2 bg-gray-200" />
                      <Skeleton className="h-4 w-16 mb-3 bg-gray-200" />
                      <div className="flex justify-between items-center mt-auto">
                        <Skeleton className="h-6 w-16 bg-gray-200" />
                        <Skeleton className="h-5 w-20 bg-gray-200" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {productsByCategory[category]?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {productsByCategory[category].map(product => (
                      <Link 
                        key={product.slug} 
                        href={`/products/${product.slug}`}
                        className="group bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md border border-gray-100 flex flex-col h-full"
                      >
                        {/* Image container with fixed aspect ratio */}
                        <div className="relative flex items-center justify-center" style={{ paddingTop: '100%' }}>
                          {product.imageUrls[0] ? (
                            <div className="absolute inset-0 p-4 flex items-center justify-center">
                              <Image
                                src={product.imageUrls[0]}
                                alt={product.name}
                                width={400}
                                height={400}
                                className="max-w-full max-h-full object-contain"
                                priority={true}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder.png';
                                  (e.target as HTMLImageElement).className = 'absolute inset-0 flex items-center justify-center';
                                  (e.target as HTMLImageElement).innerHTML = '<span class="text-gray-400">No image</span>';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-gray-400">No image</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="p-4 flex flex-col flex-grow">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900 line-clamp-1">{product.name}</h3>
                              <p className="text-sm text-gray-500 mt-1">{product.brand}</p>
                            </div>
                            {product.reviewCount !== undefined && product.rating !== undefined && (
                              <div className='flex items-center gap-1'>
                                <p className='text-sm text-gray-500'>{`(${product.reviewCount})`}</p>
                                <div className="flex items-center bg-gray-100 rounded-full px-2 py-1">
                                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                  <span className="text-xs font-medium ml-1">
                                    {product.rating.toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                            
                          <span className="font-bold text-lg text-gray-900 mt-3">
                            ${product.price.toFixed(2)}
                            {product.originalPrice && product.originalPrice > product.price && (
                              <span className="text-sm text-gray-500 line-through ml-2">
                                ${product.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center border border-dashed border-gray-200 rounded-lg">
                    <p className="text-gray-500">No products found in this category</p>
                    <Link href={`/products/${category}`}>
                      <Button variant="outline" className="mt-4">
                        Browse Category
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}