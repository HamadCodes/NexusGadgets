import { useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ImagePreview } from '@/models/Product';

interface ImageUploaderProps {
  imagePreviews: ImagePreview[];
  onSelectFiles: (files: FileList | null) => void;
  onRemove: (index: number) => void;
}

export function ImageUploader({ imagePreviews, onSelectFiles, onRemove }: ImageUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  
  return (
    <div>
      <div className="flex items-center gap-2">
        <Button type="button" onClick={() => fileRef.current?.click()}>Select Images</Button>
        <p className="text-sm text-muted-foreground">Recommended aspect ratio: 1:1</p>
      </div>
      <input ref={fileRef} type="file" multiple accept="image/*" onChange={(e) => onSelectFiles(e.target.files)} className="hidden" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
        {imagePreviews.map((img, i) => (
          <div key={i} className="relative bg-gray-50 border rounded overflow-hidden flex items-center justify-center" style={{ minHeight: 96 }}>
            {img.type === 'existing' ? (
              <Image 
                src={img.url} 
                alt={`preview-${i}`} 
                width={96}
                height={96}
                className="object-contain"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img.url} alt={`preview-${i}`} className="max-w-full max-h-40 object-contain" />
            )}
            <div  
              onClick={() => onRemove(i)} 
              className="absolute text-center top-2 right-2 bg-red-600 text-white rounded-full w-7 h-7 cursor-pointer items-center justify-center"
            >
              x
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}