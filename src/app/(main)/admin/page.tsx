'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';

type AdminUser = {
  role: string;
};

export default function AdminProductPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      if ((session?.user as AdminUser)?.role === 'admin') setIsAdmin(true);
      else router.push('/');
      setIsLoading(false);
    }
  }, [status, session, router]);

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!isAdmin) return <div className="p-8">Unauthorized</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Product</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}