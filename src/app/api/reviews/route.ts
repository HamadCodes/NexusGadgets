import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Review } from '@/models/Review';
import { Product } from '@/models/Product';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { getCollection } from '@/lib/mongodb';
import authOptions from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { productId, orderId, rating, comment, item } = body;
    const userId = session.user.id;

    if (!productId || !orderId || !rating || !comment || !item || !item.itemId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = await clientPromise;
    const sessionMongo = client.startSession();
    
    try {
      sessionMongo.startTransaction();
      
      const reviewsCollection = await getCollection<Review>('reviews');
      const productsCollection = await getCollection<Product>('products');
      
      // Create review object without _id
      const review: Omit<Review, '_id'> = {
        userId: new ObjectId(userId),
        productId: productId,
        orderId: new ObjectId(orderId),
        item: {
          itemId: item.itemId,
          color: item.color,
          storage: item.storage
        },
        rating,
        comment,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Insert review
      const result = await reviewsCollection.insertOne(review as Review, { session: sessionMongo });
      
      // Update product rating
      await productsCollection.updateOne(
        { _id: new ObjectId(productId) },
        [{
          $set: {
            reviewCount: { $add: [{ $ifNull: ["$reviewCount", 0] }, 1] },
            totalRating: { $add: [{ $ifNull: ["$totalRating", 0] }, rating] },
            rating: {
              $divide: [
                { $add: [{ $ifNull: ["$totalRating", 0] }, rating] },
                { $add: [{ $ifNull: ["$reviewCount", 0] }, 1] }
              ]
            }
          }
        }],
        { session: sessionMongo }
      );
      
      await sessionMongo.commitTransaction();
      
      // Return review with generated _id
      return NextResponse.json({
        ...review,
        _id: result.insertedId
      });
    } catch (error) {
      await sessionMongo.abortTransaction();
      throw error;
    } finally {
      sessionMongo.endSession();
    }
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}