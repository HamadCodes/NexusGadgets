import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { Review } from '@/models/Review';
import { ObjectId, Document, Sort, Filter } from 'mongodb';

// Define types
interface UserAggregationResult extends Document {
  _id: ObjectId;
  name: string;
  image?: string | null;
  hasImage: boolean;
}

interface EnhancedReview extends Review {
  name: string | null;
  userImage: string | null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;
  const url = new URL(req.url);
  const searchParams = url.searchParams;
  
  // Pagination parameters
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '5');
  
  // Filter parameters
  const rating = searchParams.get('rating');
  const sort = searchParams.get('sort') || 'newest';
  
  try {
    const reviewsCollection = await getCollection<Review>('reviews');
    
    // Build query with proper typing
    const query: Filter<Review> = { productId: productId };
    
    // Rating filter
    if (rating) {
      const ratingValue = parseInt(rating);
      if (!isNaN(ratingValue)) {
        query.rating = ratingValue;
      }
    }
    
    // Build sort option with proper typing
    let sortOption: Sort = { createdAt: -1 }; // Default: newest first
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'highest') sortOption = { rating: -1 };
    if (sort === 'lowest') sortOption = { rating: 1 };
    
    // Get reviews with pagination and sorting
    const reviews = await reviewsCollection.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
    
      // Get total count for pagination
    const totalCount = await reviewsCollection.countDocuments(query);
    
    if (reviews.length === 0) {
      return NextResponse.json({
        reviews: [],
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
      });
    }

    // Get unique user IDs from reviews
    const userIds = [...new Set(reviews.map(review => review.userId))];
    const objectIds = userIds.map(id => new ObjectId(id));

    // Fetch users with image existence flag
    const usersCollection = await getCollection<UserAggregationResult>('users');
    const aggregationPipeline = [
      {
        $match: { _id: { $in: objectIds } }
      },
      {
        $project: {
          name: 1,
          image: 1,
          hasImage: { 
            $cond: {
              if: { $ne: ["$imageBuffer", null] },
              then: true,
              else: false
            }
          }
        }
      }
    ];
    
    const users = await usersCollection.aggregate<UserAggregationResult>(
      aggregationPipeline
    ).toArray();

    // Create user map for quick lookup
    const userMap = new Map<string, UserAggregationResult>();
    users.forEach(user => {
      userMap.set(user._id.toString(), user);
    });

    // Enhance reviews with user data
    const reviewsWithUsers: EnhancedReview[] = reviews.map(review => {
      const userId = review.userId.toString();
      const user = userMap.get(userId);
      
      let userImage = null;
      const name = user?.name || null;

      if (user) {
        if (user.hasImage) {
          // Use the new public image endpoint
          userImage = `/api/user/public-image?userId=${userId}`;
        } else if (user.image) {
          userImage = user.image;
        }
      }

      return {
        ...review,
        name,
        userImage
      };
    });

    return NextResponse.json({
      reviews: reviewsWithUsers,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}