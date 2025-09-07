import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Product } from '@/models/Product';

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = parseInt(searchParams.get('skip') || '0');
    
    let query: Record<string, unknown> = {};
    if (category) {
      query = { category };
    }
    
    const products = await db.collection<Product>('products')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const total = await db.collection<Product>('products').countDocuments(query);
    
    return NextResponse.json({ 
      products, 
      total,
      hasMore: skip + limit < total
    });
    
  } catch (error: unknown) {
    console.error('Error fetching products:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json({ 
      error: 'Server error',
      message: errorMessage
    }, { status: 500 });
  }
}