import ProductGrid from '@/components/ProductGrid';
import { getCollection } from '@/lib/mongodb';
import { Product, ProductSearchResult } from '@/models/Product';
import Link from 'next/link';

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const {q} = await searchParams
  const {page} = await searchParams
  const query = Array.isArray(q) 
    ? q[0] 
    : q || '';
  
  const searchParamsPage = Array.isArray(page)
    ? parseInt(page[0] || '1')
    : parseInt(page || '1');
  
  const limit = 12;
  const skip = (searchParamsPage - 1) * limit;

  let products: ProductSearchResult[] = [];
  let totalCount = 0;

  if (query) {
    const productsCollection = await getCollection<Product>('products');
    
    const pipeline = [
      {
        $match: {
          $text: { $search: query }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          price: 1,
          originalPrice:1,
          imageUrls: 1,
          category: 1,
          brand: 1,
          description: 1,
          rating: 1,
          reviewCount: 1,
          discountPercentage: 1,
          score: { $meta: "textScore" }
        }
      },
      { $sort: { score: { $meta: "textScore" } } },
      { $skip: skip },
      { $limit: limit }
    ];

    const results = await productsCollection.aggregate(pipeline).toArray();
    
    // Count total matching documents
    const countPipeline = [
      { $match: { $text: { $search: query } } },
      { $count: "total" }
    ];
    const countResult = await productsCollection.aggregate(countPipeline).toArray();
    
    products = results.map(product => ({
      _id: product._id.toString(),
      name: product.name,
      slug: product.slug,
      price: product.price,
      originalPrice : product.originalPrice,
      imageUrls: product.imageUrls,
      brand: product.brand,
      category: product.category,
      reviewCount: product.reviewCount,
      rating: product.rating
    }));
    
    totalCount = countResult.length > 0 ? countResult[0].total : 0;
  }

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {query ? `Search Results for "${query}"` : 'Search Products'}
      </h1>

      {!query ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">Enter a search term to find products</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No products found for &quot;{query}&quot;</p>
        </div>
      ) : (
        <>
          <ProductGrid products={products} />

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="join">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <Link
                    key={pageNum}
                    href={`?q=${query}&page=${pageNum}`}
                    className={`join-item btn ${pageNum === searchParamsPage ? 'btn-active' : ''}`}
                  >
                    {pageNum}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}