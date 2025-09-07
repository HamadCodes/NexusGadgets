// app/api/admin/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getCollection } from '@/lib/mongodb';
import { Order, OrderItem } from '@/models/Order';
import { ObjectId } from 'mongodb';
import { stripe } from '@/lib/stripe';
import authOptions from '@/lib/auth';

// Define a proper Product interface for inventory restoration
interface Product {
  _id: ObjectId;
  stockCount: number;
}

// Define a type for the update set
interface OrderUpdateSet {
  updatedAt: Date;
  status?: string;
  deliveredAt?: Date;
  refunded?: boolean;
  refundId?: string;
  refundedAmount?: number;
  refundedAt?: Date;
  // For nested updates
  'items.$[].delivered'?: boolean;
  'items.$[].deliveredAt'?: Date;
  'items.$.delivered'?: boolean;
  'items.$.deliveredAt'?: Date;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Unwrap the params promise
  const { id } = await params;

  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, itemId } = await req.json();
    let updateSet: Partial<OrderUpdateSet> = { 
      updatedAt: new Date() 
    };
    
    const ordersCollection = await getCollection<Order>('orders');
    
    // First get the current order to check payment status
    const currentOrder = await ordersCollection.findOne({ 
      _id: new ObjectId(id) 
    });
    
    if (!currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // Prevent cancellation if order is already shipped or delivered
    if (status === 'cancelled' && 
        (currentOrder.status === 'shipped' || currentOrder.status === 'delivered')) {
      return NextResponse.json(
        { error: 'Cannot cancel order that has already been shipped. Please initiate a return instead.' }, 
        { status: 400 }
      );
    }
    
    let result;

    if (status === 'delivered' && itemId) {
      // Update specific item as delivered
      updateSet = {
        'items.$.delivered': true,
        'items.$.deliveredAt': new Date(),
        updatedAt: new Date()
      };

      result = await ordersCollection.findOneAndUpdate(
        { 
          _id: new ObjectId(id),
          'items._id': new ObjectId(itemId)
        },
        { $set: updateSet },
        { returnDocument: 'after' }
      );
    } 
    else if (status === 'delivered') {
      // Mark entire order as delivered
      updateSet = {
        status: 'delivered',
        deliveredAt: new Date(),
        updatedAt: new Date(),
        'items.$[].delivered': true,
        'items.$[].deliveredAt': new Date()
      };

      result = await ordersCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateSet },
        { returnDocument: 'after' }
      );
    }
    else if (status === 'cancelled' && currentOrder.paymentStatus === 'succeeded') {
      // Handle order cancellation with automatic refund
      try {
        // Process refund through Stripe
        const refund = await stripe.refunds.create({
          payment_intent: currentOrder.paymentIntentId!,
          amount: Math.round(currentOrder.total), // Ensure we're refunding the correct amount
        });
        
        // Update order with refund details
        updateSet = {
          status: 'cancelled',
          refunded: true,
          refundId: refund.id,
          refundedAmount: currentOrder.total / 100, // Convert cents to dollars
          refundedAt: new Date(),
          updatedAt: new Date()
        };
        
        // Restore inventory for cancelled items
        await restoreInventory(currentOrder.items);
        
        result = await ordersCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: updateSet },
          { returnDocument: 'after' }
        );
        
        // Send cancellation email to customer
        await sendCancellationEmail(currentOrder);
        
      } catch (error) {
        console.error('Failed to process refund:', error);
        return NextResponse.json(
          { error: 'Failed to process refund. Please try again or contact support.' }, 
          { status: 500 }
        );
      }
    }
    else if (status === 'cancelled') {
      // Handle cancellation for orders that weren't paid
      updateSet.status = 'cancelled';
      
      // Restore inventory for cancelled items
      await restoreInventory(currentOrder.items);
      
      result = await ordersCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateSet },
        { returnDocument: 'after' }
      );
      
      // Send cancellation email to customer
      await sendCancellationEmail(currentOrder);
    }
    else {
      // Update order status only (for non-refund cases)
      updateSet.status = status;
      
      result = await ordersCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateSet },
        { returnDocument: 'after' }
      );
    }

    if (!result.value) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(result.value);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(
    _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Unwrap the params promise
  const { id } = await params;
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ordersCollection = await getCollection<Order>('orders');
    const order = await ordersCollection.findOne({ 
      _id: new ObjectId(id) 
    });
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    return NextResponse.json({ order });
  } catch (error) {
    console.error('Failed to fetch order:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Helper function to restore inventory
async function restoreInventory(items: OrderItem[]) {
  try {
    const productsCollection = await getCollection<Product>('products');
    
    for (const item of items) {
      await productsCollection.updateOne(
        { _id: new ObjectId(item.productId) },
        { $inc: { stockCount: item.quantity } }
      );
    }
    
  } catch (error) {
    console.error('Failed to restore inventory:', error);
    // Don't throw error as inventory restoration shouldn't block order cancellation
  }
}

// Helper function to send cancellation email
async function sendCancellationEmail(order: Order) {
  try {
    // Implement your email sending logic here
    console.log(`Sending cancellation email for order ${order.orderNumber}`);
  } catch (error) {
    console.error('Failed to send cancellation email:', error);
    // Don't throw error as email failure shouldn't block order cancellation
  }
}