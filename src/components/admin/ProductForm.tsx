'use client';

import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { generateSlug } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FormField } from './FormField';
import { ColorRow } from './ColorRow';
import { ImageUploader } from './ImageUploader';
import { ControlledSelect } from './ControlledSelect';
import { CategorySpecs } from './CategorySpecs';
import { 
  ProductForm as ProductFormType, 
  ProductFormProps, 
  ImagePreview,
  productSchema,
  PhoneProduct,
  LaptopProduct,
  SmartwatchProduct,
  ConsoleProduct
} from '@/models/Product';
import { uploadImagesToCloudinary, deleteImagesFromCloudinary } from '@/lib/cloudinary';

export default function ProductForm({ mode, initialData }: ProductFormProps) {
  const router = useRouter();
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { 
    register, 
    control, 
    handleSubmit, 
    watch, 
    reset, 
    formState: { errors } 
  } = useForm<ProductFormType>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      name: '',
      category: 'phones',
      brand: '',
      description: '',
      shortDescription: '',
      colors: [{ name: '', hexCode: '#ffffff' }],
      price: 0,
      stockCount: 0,
      storageOptions: [],
    },
  });

  const selectedCategory = watch('category');
  const { fields: colorFields, append: appendColor, remove: removeColor } = useFieldArray({ 
    control, 
    name: 'colors' 
  });

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setExistingImages(initialData.imageUrls || []);
      setImagePreviews(
        (initialData.imageUrls || []).map((url: string) => ({ 
          url, 
          type: 'existing' 
        }))
      );
    }
  }, [mode, initialData]);

  useEffect(() => {
    return () => {
      // Clean up blob URLs
      imagePreviews.forEach(img => {
        if (img.type === 'new') {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, [imagePreviews]);

  const handleSelectFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    setImageFiles(prev => [...prev, ...arr]);
    
    const newPreviews = arr.map(file => ({
      url: URL.createObjectURL(file),
      type: 'new' as const
    }));
    
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index: number) => {
    const newPreviews = [...imagePreviews];
    const removedImage = newPreviews[index];
    
    // Handle Cloudinary deletion if it's an existing image
    if (removedImage.type === 'existing') {
      setImagesToDelete(prev => [...prev, removedImage.url]);
    }
    
    // Clean up blob URL if it's a new image
    if (removedImage.type === 'new') {
      URL.revokeObjectURL(removedImage.url);
      
      // Remove corresponding file from imageFiles
      const fileIndex = imageFiles.findIndex((_, i) => {
        // Find the file index by comparing the blob URL index
        const newPreviewIndex = imagePreviews
          .filter(img => img.type === 'new')
          .findIndex(img => img.url === removedImage.url);
          
        return i === newPreviewIndex;
      });
      
      if (fileIndex !== -1) {
        setImageFiles(prev => {
          const newFiles = [...prev];
          newFiles.splice(fileIndex, 1);
          return newFiles;
        });
      }
    }
    
    // Remove from previews
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  const processArrayField = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.filter((v) => typeof v === 'string' ? v.trim() !== '' : !!v);
    if (typeof value === 'string') return value.split(',').map((s: string) => s.trim()).filter(s => s !== '');
    return [];
  };

  const onSubmit: SubmitHandler<ProductFormType> = async (formData) => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      // Client guards
      if (imagePreviews.length === 0) {
        setMessage({ type: 'error', text: 'Please select at least one product image.' });
        setIsSubmitting(false);
        return;
      }

      if (formData.category === 'phones') {
        const storageOpts = formData.storageOptions || [];
        if (!Array.isArray(storageOpts) || storageOpts.length === 0) {
          setMessage({ type: 'error', text: 'Phones require at least one storage option.' });
          setIsSubmitting(false);
          return;
        }
      }

      // Delete marked images from Cloudinary
      if (imagesToDelete.length > 0) {
        await deleteImagesFromCloudinary(imagesToDelete);
      }

      // Upload new images
      const newImageUrls = imageFiles.length > 0 
        ? await uploadImagesToCloudinary(imageFiles)
        : [];

      // Combine kept existing images and new images
      const keptExistingImages = imagePreviews
        .filter(img => img.type === 'existing')
        .map(img => img.url);
      
      const allImageUrls = [...keptExistingImages, ...newImageUrls];

      // Build payload & process array-like fields with type assertions
      const productPayload = {
        ...formData,
        imageUrls: allImageUrls,
        slug: generateSlug(formData.name),
        // Use type assertions to safely access category-specific properties
        ...(formData.category === 'phones' && {
          connectivity: formData.connectivity 
            ? processArrayField((formData as PhoneProduct).connectivity) 
            : undefined
        }),
        ...(formData.category === 'laptops' && {
          ports: formData.ports 
            ? processArrayField((formData as LaptopProduct).ports) 
            : undefined
        }),
        ...(formData.category === 'smartwatches' && {
          compatibleOs: formData.compatibleOs 
            ? processArrayField((formData as SmartwatchProduct).compatibleOs) 
            : undefined,
          healthFeatures: formData.healthFeatures 
            ? processArrayField((formData as SmartwatchProduct).healthFeatures) 
            : undefined
        }),
        ...(formData.category === 'consoles' && {
          includedAccessories: formData.includedAccessories 
            ? processArrayField((formData as ConsoleProduct).includedAccessories) 
            : undefined
        }),
      };

      // Determine API endpoint and method
      const url = mode === 'create' 
        ? '/api/admin/products' 
        : `/api/admin/products/${initialData?._id}`;
      
      const method = mode === 'create' ? 'POST' : 'PUT';

      // Send to API
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productPayload),
      });

      const result = await res.json();
      
      if (res.ok) {
        setMessage({ 
          type: 'success', 
          text: mode === 'create' 
            ? 'Product created successfully' 
            : 'Product updated successfully' 
        });
        
        if (mode === 'create') {
          // Reset form after creation
          reset({
            name: '',
            category: 'phones',
            brand: '',
            description: '',
            shortDescription: '',
            colors: [{ name: '', hexCode: '#ffffff' }],
            price: 0,
            stockCount: 0,
            storageOptions: [],
          });
          setImageFiles([]);
          setImagePreviews([]);
          setExistingImages([]);
          setImagesToDelete([]);
        } else {
          // For edit mode, update existing images
          setExistingImages(allImageUrls);
          setImagesToDelete([]);
        }
        
        // Redirect after successful creation
        if (mode === 'create' && result.productId) {
          setTimeout(() => {
            router.push(`/admin/products/${result.productId}`);
          }, 1500);
        }
      } else {
        // Handle backend validation errors
        if (result?.details && Array.isArray(result.details)) {
          const first = result.details[0];
          setMessage({ type: 'error', text: `${first.field}: ${first.message}` });
        } else {
          setMessage({ 
            type: 'error', 
            text: result.error || 
              (mode === 'create' ? 'Error creating product' : 'Error updating product') 
          });
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Category *" error={errors.category?.message}>
              <ControlledSelect
                name="category"
                control={control}
                placeholder="Select category"
                options={[
                  { value: 'phones', label: 'Phones' },
                  { value: 'laptops', label: 'Laptops' },
                  { value: 'smartwatches', label: 'Smartwatches' },
                  { value: 'cameras', label: 'Cameras' },
                  { value: 'headphones', label: 'Headphones' },
                  { value: 'consoles', label: 'Consoles' },
                ]}
                defaultValue={initialData?.category || 'phones'}
              />
            </FormField>

            <FormField label="Product Name *" error={errors.name?.message}>
              <Input {...register('name')} />
            </FormField>

            <FormField label="Brand *" error={errors.brand?.message}>
              <Input {...register('brand')} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Price ($) *" error={errors.price?.message}>
              <Input type="number" step="0.01" {...register('price', { valueAsNumber: true })} />
            </FormField>
            <FormField label="Original Price ($)" error={errors.originalPrice?.message}>
              <Input type="number" step="0.01" {...register('originalPrice', { valueAsNumber: true })} />
            </FormField>
            <FormField label="Stock Count *" error={errors.stockCount?.message}>
              <Input type="number" {...register('stockCount', { valueAsNumber: true })} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <FormField label="Short Description *" error={errors.shortDescription?.message}>
              <Textarea rows={2} {...register('shortDescription')} />
            </FormField>

            <FormField label="Full Description *" error={errors.description?.message}>
              <Textarea rows={5} {...register('description')} />
            </FormField>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Colors *</Label>
            <div className="space-y-2">
              {colorFields.map((f, i) => (
                <ColorRow key={f.id} idx={i} register={register} remove={removeColor} />
              ))}
            </div>
            <div>
              <Button type="button" onClick={() => appendColor({ name: '', hexCode: '#ffffff' })}>
                Add Color
              </Button>
              {errors.colors && <p className="text-xs text-destructive mt-1">{errors.colors.message}</p>}
            </div>
          </div>

          <div className="p-4 border rounded">
            <h3 className="text-lg font-medium capitalize mb-3">{selectedCategory} Specifications</h3>
            <CategorySpecs category={selectedCategory} register={register} control={control} />
          </div>

          <div>
            <Label className="text-sm font-medium mb-2">Product Images *</Label>
            <ImageUploader 
              imagePreviews={imagePreviews} 
              onSelectFiles={handleSelectFiles} 
              onRemove={handleRemoveImage} 
            />
            {imagePreviews.length === 0 && <p className="text-xs text-destructive mt-2">At least one image is required</p>}
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting 
                ? (mode === 'create' ? 'Creating...' : 'Updating...') 
                : (mode === 'create' ? 'Create Product' : 'Update Product')
              }
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => { 
                reset(); 
                setImageFiles([]); 
                setImagePreviews(
                  existingImages.map((url: string) => ({ url, type: 'existing' }))
                ); 
                setImagesToDelete([]);
              }}
            >
              Reset Changes
            </Button>
          </div>

          {message && (
            <div className={`mt-4 p-3 rounded ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}
        </form>
      </div>

      <aside>
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded">
            <h4 className="text-sm font-medium">Images</h4>
            {imagePreviews.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {imagePreviews.map((img, i) => (
                  <div key={i} className="bg-white border rounded p-2 flex items-center justify-center" style={{ minHeight: 96 }}>
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
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No images selected</div>
            )}
          </div>

          <div className="p-3 border rounded">
            <h4 className="text-sm font-medium">Basic info</h4>
            <p className="text-sm text-muted-foreground mt-2"><strong>Name:</strong> {watch('name') || '-'}</p>
            <p className="text-sm text-muted-foreground"><strong>Brand:</strong> {watch('brand') || '-'}</p>
            <p className="text-sm text-muted-foreground"><strong>Price:</strong> {watch('price') ? `$${watch('price')}` : '-'}</p>
          </div>
        </div>
      </aside>
    </div>
  );
}