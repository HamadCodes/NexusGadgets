'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import ReviewList from '@/components/ReviewList';
import StarRating from '@/components/ui/StarRating';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import { Review } from '@/models/Review';
import { ObjectId } from 'mongodb';

interface FilterState {
  rating: number | null;
  sort: string;
}

interface EligibleItem {
  orderId: string;
  orderNumber: string;
  item: {
    itemId: string;
    color?: { name: string };
    storage?: { storage: string };
  };
}

interface EnhancedReview extends Review {
  _id: ObjectId;
  name: string | null;
  userImage: string | null;
}

export default function ReviewSection({ 
  productId, 
  session 
}: { 
  productId: string;
  session: {
    user: {
      id: string;
    }
  } | null;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [eligibleItems, setEligibleItems] = useState<EligibleItem[]>([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [reviews, setReviews] = useState<EnhancedReview[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    rating: null,
    sort: 'newest'
  });

  // fetchReviews is memoized with productId as dependency so its identity only changes when productId changes
  const fetchReviews = useCallback(
    async (page: number = 1, filterState: FilterState) => {
      try {
        setLoading(true);

        // Create params safely
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '5',
          sort: filterState.sort
        });

        if (filterState.rating !== null) {
          params.append('rating', filterState.rating.toString());
        }

        const res = await fetch(`/api/products/${productId}/reviews?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch reviews');
        const data = await res.json();

        setReviews(data.reviews || []);
        setTotalPages(typeof data.totalPages === 'number' ? data.totalPages : 1);
        // Only update currentPage if it actually differs to avoid unnecessary re-renders
        if (typeof data.currentPage === 'number' && data.currentPage !== page) {
          setCurrentPage(data.currentPage);
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
        toast.error('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    },
    [productId]
  );


  const fetchEligibleItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders/eligible?productId=${productId}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch eligible items');
      }
      
      const data = await res.json();
      setEligibleItems(data.eligibleItems || []);
      
      if (data.eligibleItems?.length > 0) {
        setSelectedItem(data.eligibleItems[0].item.itemId);
      }
    } catch (error) {
      console.error('Failed to fetch eligible items:', error);
      toast.error('Failed to load eligible items');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // Split effects to avoid accidental loops.
  // 1) Reviews effect: runs when page, filters or productId change
  useEffect(() => {
    // capture the current function reference
    const f = fetchReviews;
    f(currentPage, filters);
  }, [fetchReviews, currentPage, filters]);

  // 2) Eligible items effect: run when session becomes available or productId changes
  useEffect(() => {
    if (!session) return;
    const f = fetchEligibleItems;
    f();
  }, [fetchEligibleItems, session]);

  const handleSubmit = async () => {
    if (!selectedItem) {
      toast.warning('Please select an item');
      return;
    }

    const selected = eligibleItems.find(item => 
      item.item.itemId === selectedItem
    );
    
    if (!selected) {
      toast.warning('Invalid selection');
      return;
    }

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId, 
          orderId: selected.orderId,
          rating, 
          comment,
          item: selected.item
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }

      toast.success('Review submitted successfully!');
      setRating(0);
      setComment('');
      
      // Refresh reviews and reset to first page
      setCurrentPage(1);
      // Use the stable callbacks to re-fetch after submission
      fetchReviews(1, filters);
      if (session) fetchEligibleItems();
    } catch (error) {
      console.error('Submission error:', error);
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to submit review');
      } else {
        toast.error('Failed to submit review');
      }
    }
  };

  // Apply filters and reset to page 1
  const applyFilters = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    setCurrentPage(1);
    fetchReviews(1, updatedFilters);
  };

  const clearFilter = (filterKey: keyof FilterState) => {
  return () => {
    const newFilters = { ...filters };
    
    if (filterKey === 'rating') {
      newFilters.rating = null;
    } else if (filterKey === 'sort') {
      newFilters.sort = 'newest';
    }

    setFilters(newFilters);
    setCurrentPage(1);
    fetchReviews(1, newFilters);
  };
};

  return(
    <section className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
      
      {/* Filters Card */}
      <Card className="mb-6">
        <CardContent className="px-7 py-1">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Rating Filter */}
            <div className="w-full">
              <h3 className="font-medium mb-2 text-sm">Filter by rating</h3>
              <div className="flex flex-wrap gap-2">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <Button
                    key={stars}
                    variant={filters.rating === stars ? 'secondary' : 'outline'}
                    className={`flex items-center gap-1 ${
                      filters.rating === stars ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => applyFilters({
                      rating: filters.rating === stars ? null : stars
                    })}
                  >
                    <span>{stars}</span>
                    <StarRating value={stars} size={14} readOnly />
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Sort Filter */}
            <div className="w-full md:w-auto">
              <h3 className="font-medium mb-2 text-sm">Sort by</h3>
              <Select
                value={filters.sort}
                onValueChange={(value) => applyFilters({ sort: value })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="highest">Highest Rating</SelectItem>
                  <SelectItem value="lowest">Lowest Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Active Filters */}
          {(filters.rating !== null || filters.sort !== 'newest') && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {filters.rating !== null && (
                <Badge 
                  className="px-3 py-1 flex items-center gap-1 cursor-pointer"
                  onClick={clearFilter('rating')}
                >
                  <span>{filters.rating} stars</span>
                  <X size={14} />
                </Badge>
              )}
              {filters.sort !== 'newest' && (
                <Badge 
                  className="px-3 py-1 flex items-center gap-1 cursor-pointer"
                  onClick={clearFilter('sort')}
                >
                  <span>
                    {filters.sort === 'oldest' && 'Oldest first'}
                    {filters.sort === 'highest' && 'Highest rating'}
                    {filters.sort === 'lowest' && 'Lowest rating'}
                  </span>
                  <X size={14} />
                </Badge>
              )}
              <Button 
                variant="link"
                className="text-blue-600 h-auto p-0 text-sm"
                onClick={() => applyFilters({ rating: null, sort: 'newest' })}
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Review Card */}
      {session && eligibleItems.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Add Your Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Order Item
                </label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full p-2 border rounded bg-background"
                >
                  {eligibleItems.map(entry => (
                    <option 
                      key={entry.item.itemId} 
                      value={entry.item.itemId}
                    >
                      Order #{entry.orderNumber} - 
                      {entry.item.color ? ` Color: ${entry.item.color.name}` : ''}
                      {entry.item.storage ? ` Storage: ${entry.item.storage.storage}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <StarRating 
                  value={rating} 
                  onChange={setRating} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Review</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience..."
                  rows={4}
                />
              </div>
              
              <Button onClick={handleSubmit}>Submit Review</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <>
          <ReviewList reviews={reviews} />
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  
                  if (totalPages > 5) {
                    if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <span className="px-4 py-2 flex items-center text-muted-foreground">...</span>
                )}
                
                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto max-w-md">
              <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <StarRating value={0} size={32} readOnly />
              </div>
              <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to share your experience with this product
              </p>
              {filters.rating && (
                <Button 
                  variant="outline"
                  onClick={() => applyFilters({ rating: null })}
                >
                  Clear filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
