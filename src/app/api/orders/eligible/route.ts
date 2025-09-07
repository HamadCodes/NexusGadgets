import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getCollection } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { Review } from '@/models/Review';
import { ObjectId } from 'mongodb';
import authOptions from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const ordersCollection = await getCollection<Order>('orders');
    const reviewsCollection = await getCollection<Review>('reviews');
    const userId = session.user.id;

    // Corrected query to properly match nested fields
    const orders = await ordersCollection.find({
      'customer.id': new ObjectId(userId),
      'items.productId': productId
    }).toArray();
    
    const eligibleItems = [];
    
    for (const order of orders) {
      for (const item of order.items) {
        // Only consider items for this product
        if (item.productId !== productId) continue;
        
        // Only include delivered items
        if (!item.delivered) continue;
        
        // Check if review already exists for this item
        const existingReview = await reviewsCollection.findOne({
          userId: new ObjectId(userId),
          productId,
          'item.itemId': item._id.toString()
        });
        
        if (!existingReview) {
          eligibleItems.push({
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            orderDate: order.orderDate,
            item: {
              itemId: item._id.toString(),
              color: item.color,
              storage: item.storage
            }
          });
        }
      }
    }
      
    return NextResponse.json({ eligibleItems });
  } catch (error) {
    console.error('Error fetching eligible orders:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}