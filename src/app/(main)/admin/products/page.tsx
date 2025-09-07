'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { format } from 'date-fns';
import { Product } from '@/models/Product';

export default function AdminProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      if (session?.user?.role === 'admin') {
        setIsAdmin(true);
        fetchProducts();
      } else {
        router.push('/');
      }
    }
  }, [status, session, router]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      setProducts(data.products);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        const res = await fetch(`/api/admin/products/${productId}`, {
          method: 'DELETE',
        });
        
        if (res.ok) {
          setProducts(products.filter(p => p._id.toString() !== productId));
        }
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8">Loading...</div>;
  if (!isAdmin) return <div className="p-8">Unauthorized</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Product Management</CardTitle>
            <Link href="/admin/products/new">
              <Button>Add New Product</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Input
              placeholder="Search products by name or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product._id.toString()}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="capitalize">{product.category}</TableCell>
                  <TableCell>{product.brand}</TableCell>
                  <TableCell>${product.price}</TableCell>
                  <TableCell>{product.stockCount}</TableCell>
                  <TableCell>
                    {format(new Date(product.createdAt), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="flex space-x-2">
                    <Link href={`/admin/products/${product._id}`}>
                      <Button variant="secondary" size="sm">Edit</Button>
                    </Link>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deleteProduct(product._id.toString())}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}