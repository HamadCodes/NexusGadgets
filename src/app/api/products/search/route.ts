import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { Product, ProductSearchResult } from '@/models/Product';

export async function GET(req: NextRequest) {
  const searchQuery = req.nextUrl.searchParams.get('q');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '5');
  
  if (!searchQuery) {
    return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
  }

  try {
    const productsCollection = await getCollection<Product>('products');
    
    const pipeline = [
      {
        $match: {
          $text: { $search: searchQuery }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          price: 1,
          imageUrls: 1,
          category: 1,
          brand: 1,
          reviewCount: 1,
          rating: 1,
          score: { $meta: "textScore" }
        }
      },
      { $sort: { score: { $meta: "textScore" } } },
      { $limit: limit }
    ];

    const results = await productsCollection.aggregate(pipeline).toArray();

    // Convert to ProductSearchResult
    const formattedResults: ProductSearchResult[] = results.map(product => ({
      _id: product._id.toString(),
      name: product.name,
      slug: product.slug,
      price: product.price,
      imageUrls: product.imageUrls,
      brand: product.brand,
      category: product.category,
      reviewCount: product.reviewCount,
      rating: product.rating
    }));

    return NextResponse.json(formattedResults);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}