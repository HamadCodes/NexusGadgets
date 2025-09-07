// app/api/products/batch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface Product {
  id: string;
  name: string;
  imageUrls: string;
  price: number;
  slug: string;
  colors: { name: string, hex: string }[];
  category: string;
  storageOptions?: { storage: string, price: number }[];
  originalPrice?: number;
  discountPercentage?: number;
}

export async function POST(req: NextRequest) {
  const { ids } = await req.json() as { ids?: string[] };

  if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string')) {
    return NextResponse.json({ error: 'Invalid `ids` payload' }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();

  try {
    const objectIds = ids.map(id => new ObjectId(id));
    const docs = await db
      .collection('products')
      .find({ _id: { $in: objectIds } })
      .toArray();

    // Convert _id → id string and include necessary fields
    const products = docs.map(doc => {
      const product: Product = {
        id: doc._id.toHexString(),
        name: doc.name,
        imageUrls: doc.imageUrls,
        price: doc.price,
        slug: doc.slug,
        colors: doc.colors,
        category: doc.category,
        storageOptions: doc.storageOptions || undefined,
      };

      // Include original price if available
      if (doc.originalPrice) {
        product.originalPrice = doc.originalPrice;
      }

      // Include discount percentage if available
      if (doc.discountPercentage) {
        product.discountPercentage = doc.discountPercentage;
      }

      return product;
    });

    return NextResponse.json(products);
  }catch (error: unknown) {
  console.error('Error fetching batch products:', error);

  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : String(error);

  return NextResponse.json({ error: 'Server error', message }, { status: 500 });
}
}