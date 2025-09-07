import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import StarRating from '@/components/ui/StarRating';
import { Review } from '@/models/Review';
import { ObjectId } from 'mongodb';
import { Card, CardContent } from './ui/card';

interface EnhancedReview extends Review {
  _id: ObjectId;
  name: string | null;
  userImage: string | null;
}

export default function ReviewList({ reviews }: { reviews: EnhancedReview[] }) {
  return (
    <div className="space-y-6">
      {reviews.map((review) => {
        const userId = review.userId?.toString();
        const imageUrl = review.userImage || (userId ? `/api/user/public-image?userId=${encodeURIComponent(userId)}` : '');

        return (
          <Card key={review._id.toString()} className="p-3">
            <CardContent className="p-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Avatar>
                    {imageUrl ? (
                      <AvatarImage
                        src={imageUrl}
                        alt={review.name || 'User avatar'}
                        onError={(e) => {
                          // If it fails, hide the image element so AvatarFallback shows.
                          // (Setting src='' causes a re-request in some cases, so replace with a data URL empty)
                          const target = e.currentTarget as HTMLImageElement;
                          try { target.src = ''; } catch { /* ignore */ }
                        }}
                      />
                    ) : null}
                    <AvatarFallback>
                      {review.name ? review.name.charAt(0).toUpperCase() : 'G'}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <h4 className="font-medium">{review.name || 'Guest'}</h4>
                    <StarRating value={review.rating} readOnly size={16} className="mt-1" />
                  </div>
                </div>

                <p className="text-gray-700 mt-2">{review.comment}</p>

                {review.item && (review.item.color || review.item.storage) && (
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    {review.item.color && (
                      <div>
                        <span className="font-medium">Color: </span>
                        <span>{review.item.color.name}</span>
                      </div>
                    )}
                    {review.item.storage && (
                      <div>
                        <span className="font-medium">Storage: </span>
                        <span>{review.item.storage.storage}</span>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-sm text-gray-500 mt-2">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
