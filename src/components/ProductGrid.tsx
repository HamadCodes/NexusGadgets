import Link from 'next/link';
import Image from 'next/image';
import { ProductSearchResult } from '@/models/Product';
import { Star } from 'lucide-react';

export default function ProductGrid({ products }: { products: ProductSearchResult[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
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
                      {product.rating?.toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className='mt-3 items-center flex gap-2'>
            <p className="font-bold text-lg text-gray-900">
              ${product.price.toFixed(2)}
            </p>

            {product.originalPrice && (
              <p className="font-bold text-sm text-gray-500 line-through">
                ${product.originalPrice.toFixed(2)}
              </p>
            )}
            </div>

          </div>
        </Link>
      ))}
    </div>
  );
}