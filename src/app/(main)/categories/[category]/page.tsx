import { getProductsAndFilterOptionsByCategory } from '@/lib/products';
import ProductGrid from '@/components/ProductGrid';
import CategoryFilters from '@/components/CategoryFilters';
import { ProductSearchResult, ValidCategory } from '@/models/Product';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

// Define the expected props interface
interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  // Await the params and searchParams
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  // Cast to ValidCategory after validation
  const validCategories: ValidCategory[] = [
    'phones',
    'laptops',
    'smartwatches',
    'cameras',
    'headphones',
    'consoles',
  ];

  const category = resolvedParams.category as ValidCategory;
  
  // Validate category parameter
  if (!validCategories.includes(category)) {
    return <div className="container mx-auto px-4 py-8 text-center">Invalid category</div>;
  }
  
  // Get pagination parameters
  const page = resolvedSearchParams.page ? parseInt(resolvedSearchParams.page as string) : 1;
  const limit = 12;
  
  // Get products and filter options
  const { 
    products, 
    filterOptions, 
    pagination 
  } = await getProductsAndFilterOptionsByCategory(
    category, 
    resolvedSearchParams,
    page,
    limit
  );
  
  const gridProducts = products as ProductSearchResult[];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 capitalize">{category}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <CategoryFilters 
            category={category} 
            filterOptions={filterOptions} 
          />
        </div>
        <div className="lg:col-span-3">
          {products.length > 0 ? (
            <div>
              <ProductGrid products={gridProducts} />
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-12">
                  <Pagination>
                    <PaginationContent>
                      {page > 1 && (
                        <PaginationItem>
                          <PaginationPrevious 
                            href={`?${new URLSearchParams({
                              ...resolvedSearchParams,
                              page: (page - 1).toString()
                            } as Record<string, string>)}`}
                          />
                        </PaginationItem>
                      )}
                      
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum = i + 1;
                        
                        // Handle large page counts
                        if (pagination.totalPages > 5) {
                          if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }
                        }
                        
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              href={`?${new URLSearchParams({
                                ...resolvedSearchParams,
                                page: pageNum.toString()
                              } as Record<string, string>)}`}
                              isActive={pageNum === page}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      {pagination.totalPages > 5 && page < pagination.totalPages - 2 && (
                        <PaginationItem>
                          <PaginationLink
                            href={`?${new URLSearchParams({
                              ...resolvedSearchParams,
                              page: pagination.totalPages.toString()
                            } as Record<string, string>)}`}
                          >
                            ...{pagination.totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      
                      {page < pagination.totalPages && (
                        <PaginationItem>
                          <PaginationNext 
                            href={`?${new URLSearchParams({
                              ...resolvedSearchParams,
                              page: (page + 1).toString()
                            } as Record<string, string>)}`}
                          />
                        </PaginationItem>
                      )}
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium text-gray-900">No products found</h3>
              <p className="mt-2 text-gray-500">
                Try adjusting your filters to find what you are looking for.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}