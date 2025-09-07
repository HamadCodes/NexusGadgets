'use client'

import { useState } from 'react';
import { Product } from '@/models/Product';
import ImageGallery from './ImageGallery';
import ColorSelector from './ColorSelector';
import AddToCart from './AddToCart';
import AddToFavorites from './AddtoFavorite';
import StarRating from './ui/StarRating';

export default function ProductDetails({ product }: { product: Product }) {
  const cleanProduct = JSON.parse(JSON.stringify(product));
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedStorage, setSelectedStorage] = useState(
    product.category === 'phones' && product.storageOptions?.length 
      ? product.storageOptions[0] 
      : undefined
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <ImageGallery images={product.imageUrls}/>
      
      <div>
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <div className="flex items-center my-4">
                <StarRating 
                value={product.rating} 
                readOnly 
                size={16}
              />
          <span className="ml-2 text-gray-600">({product.reviewCount || 0})</span>
        </div>
        
        <div className="my-6">
          <span className="text-3xl font-bold">
            ${selectedStorage 
              ? (product.price + selectedStorage.price).toFixed(2)
              : product.price.toFixed(2)}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="ml-2 text-gray-500 line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
          {selectedStorage && (
            <p className="text-sm text-gray-500 mt-1">
              Base price ${product.price.toFixed(2)} + ${selectedStorage.price.toFixed(2)} for {selectedStorage.storage}
            </p>
          )}
        </div>
        
        <div className="my-6">
          <p className="text-lg">{product.shortDescription}</p>
        </div>
        
        <div className="my-6">
          <ColorSelector 
            colors={product.colors} 
            selectedColor={selectedColor}
            onSelect={setSelectedColor}
          />
        </div>
        
        {product.category === 'phones' && product.storageOptions && product.storageOptions.length > 0 && (
          <div className="my-6">
            <label className="block mb-2 font-medium">Storage</label>
            <div className="flex flex-wrap gap-2">
              {product.storageOptions.map((option) => (
                <button 
                  key={option.storage}
                  className={`px-4 py-2 border rounded hover:bg-gray-100 ${
                    selectedStorage?.storage === option.storage 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300'
                  }`}
                  onClick={() => setSelectedStorage(option)}
                >
                  {option.storage} (+${option.price.toFixed(2)})
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="my-8 flex gap-5">
          <AddToCart 
            product={cleanProduct}
            selectedColor={selectedColor}
            selectedStorage={selectedStorage}
          />
          <AddToFavorites product={cleanProduct}/>
        </div>
        
        <div className="mt-8 border-t pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Availability</h3>
              <p>{product.stockCount > 0 ? 'In Stock' : 'Out of Stock'}</p>
            </div>
            <div>
              <h3 className="font-semibold">Brand</h3>
              <p className="capitalize">{product.brand}</p>
            </div>
            <div>
              <h3 className="font-semibold">Category</h3>
              <p className="capitalize">{product.category}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}