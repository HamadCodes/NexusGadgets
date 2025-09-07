'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import ProductForm from '@/components/admin/ProductForm';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Product } from '@/models/Product';
import { ProductForm as ProductFormType } from '@/models/Product';

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [product, setProduct] = useState<ProductFormType & { _id?: string }>();
  const [loading, setLoading] = useState(true);

  const isNewProduct = id === 'new';

  useEffect(() => {
    const fetchProduct = async () => {
      if (isNewProduct) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/admin/products/${id}`);
        if (!res.ok) {
          throw new Error('Failed to fetch product');
        }
        const data: Product = await res.json();
        
        // Convert the product to match the ProductFormType
        const formData: ProductFormType & { _id?: string } = {
          ...data,
          _id: data._id?.toString(),
          // Ensure all category-specific fields are properly typed
          ...(data.category === 'phones' && {
            connectivity: Array.isArray(data.connectivity) 
              ? data.connectivity 
              : data.connectivity ? [data.connectivity] : []
          }),
          ...(data.category === 'laptops' && {
            ports: Array.isArray(data.ports) 
              ? data.ports 
              : data.ports ? [data.ports] : []
          }),
          ...(data.category === 'smartwatches' && {
            compatibleOs: Array.isArray(data.compatibleOs) 
              ? data.compatibleOs 
              : data.compatibleOs ? [data.compatibleOs] : [],
            healthFeatures: Array.isArray(data.healthFeatures) 
              ? data.healthFeatures 
              : data.healthFeatures ? [data.healthFeatures] : []
          }),
          ...(data.category === 'consoles' && {
            includedAccessories: Array.isArray(data.includedAccessories) 
              ? data.includedAccessories 
              : data.includedAccessories ? [data.includedAccessories] : []
          })
        };
        
        setProduct(formData);
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      if (session?.user?.role === 'admin') {
        setIsAdmin(true);
        if (!isNewProduct) {
          fetchProduct();
        } else {
          setLoading(false);
        }
      } else {
        router.push('/');
      }
    }
  }, [status, session, router, id, isNewProduct]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!isAdmin) return <div className="p-8">Unauthorized</div>;
  if (!isNewProduct && !product) return <div className="p-8">Product not found</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {isNewProduct ? 'Create New Product' : `Edit Product: ${product?.name}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm 
            mode={isNewProduct ? 'create' : 'edit'} 
            initialData={product} 
          />
        </CardContent>
      </Card>
    </div>
  );
}