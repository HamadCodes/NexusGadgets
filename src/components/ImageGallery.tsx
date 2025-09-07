"use client"

import { useState } from 'react';
import Image from 'next/image';

export default function ImageGallery({ images }: { images: string[] }) {
  const [selectedImage, setSelectedImage] = useState(images[0] || '');

  return (
    <div>
      <div className="rounded-lg max-h-[500px] max-w-[500px] m-auto flex items-center justify-center mb-4">
        {selectedImage ? (
          <Image
            src={selectedImage}
            alt="Selected"
            width={600}
            height={600}
            className="max-h-full max-w-full object-contain"
            style={{ objectFit: 'contain', width: '100%', height: '100%' }}
            priority
          />
        ) : (
          <span className="text-gray-500">No image available</span>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(image)}
            className={`min-w-16 h-16 border rounded ${selectedImage === image ? 'border-blue-500' : 'border-gray-300'}`}
          >
            <Image
              src={image}
              alt={`Thumbnail ${index + 1}`}
              width={200}
              height={200}
              className="w-full h-full object-contain"
              style={{ objectFit: 'contain', width: '100%', height: '100%' }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}