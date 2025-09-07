import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getDb } from '@/lib/mongodb';
import { ObjectId, Db } from 'mongodb';
import { stripe } from '@/lib/stripe';
import { Order, OrderItem } from '@/models/Order';
import Stripe from 'stripe';
import authOptions from '@/lib/auth';

// Define interfaces for the data structures
interface OrderUpdateSet {
  status: string;
  updatedAt: Date;
  refunded?: boolean;
  refundId?: string;
  refundedAmount?: number;
  refundedAt?: Date;
}

interface OrderWithCustomerId extends Order {
  customer: {
    id: ObjectId;
    name: string;
    email: string;
    phone: string;
    // Add other customer properties as needed
  };
}

// Define a minimal Product interface for inventory restoration
interface Product {
  _id: ObjectId;
  stock: number;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params object first
    const { id: orderId } = await params;
    
    // Check authentication using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await getDb();

    // Validate the order ID
    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // Check if order exists
    const order = await db.collection<OrderWithCustomerId>('orders').findOne({ 
      _id: new ObjectId(orderId)
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if the authenticated user owns this order
    if (order.customer.id.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to cancel this order' },
        { status: 403 }
      );
    }

    // Check if order can be cancelled (only processing orders can be cancelled)
    if (order.status !== 'processing') {
      return NextResponse.json(
        { error: 'Only processing orders can be cancelled' },
        { status: 400 }
      );
    }

    const updateSet: OrderUpdateSet = {
      status: 'cancelled',
      updatedAt: new Date()
    };

    // Process refund if payment was successful
    if (order.paymentStatus === 'succeeded' && order.paymentIntentId) {
      try {
        // Get all refunds for this payment intent to calculate total refunded amount
        const refunds = await stripe.refunds.list({
          payment_intent: order.paymentIntentId,
          limit: 100
        });
        
        // Calculate total amount already refunded (in cents)
        const alreadyRefunded = refunds.data.reduce(
          (total: number, refund: Stripe.Refund) => total + refund.amount, 
          0
        );
        
        // Calculate remaining amount to refund (in cents)
        // Note: order.total is already in cents (as per Stripe convention)
        const refundAmount = order.total - alreadyRefunded;
        
        // Only process refund if there's an amount to refund
        if (refundAmount > 0) {
          const refund = await stripe.refunds.create({
            payment_intent: order.paymentIntentId,
            amount: refundAmount,
          });
          
          // Update order with refund details
          updateSet.refunded = true;
          updateSet.refundId = refund.id;
          // Convert cents to dollars for storage
          updateSet.refundedAmount = (order.refundedAmount || 0) + (refundAmount / 100);
          updateSet.refundedAt = new Date();
        }
        
        // Mark all items as refunded (full refund)
        for (const item of order.items) {
          const remainingQty = item.quantity - (item.refundedQuantity || 0);
          if (remainingQty > 0) {
            await db.collection('orders').updateOne(
              { 
                _id: new ObjectId(orderId),
                'items._id': item._id
              },
              { 
                $inc: { 
                  'items.$.refundedQuantity': remainingQty
                },
                $set: {
                  'items.$.refundReason': 'Order cancellation',
                  'items.$.lastRefundedAt': new Date()
                }
              }
            );
          }
        }
        
        // Restore inventory for all items
        await restoreInventory(order.items, db, orderId);
        
      } catch (error) {
        console.error('Refund processing error:', error);
        return NextResponse.json(
          { error: 'Failed to process refund. Please try again or contact support.' }, 
          { status: 500 }
        );
      }
    } else {
      // For orders that weren't paid, just update status
      // Restore inventory for cancelled items
      await restoreInventory(order.items, db, orderId);
    }

    // Update order status
    const result = await db.collection('orders').updateOne(
      { _id: new ObjectId(orderId) },
      { $set: updateSet }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to cancel order' },
        { status: 400 }
      );
    }

    // Send cancellation email to customer
    await sendCancellationEmail(order);

    // Return updated order
    const updatedOrder = await db.collection('orders').findOne({
      _id: new ObjectId(orderId),
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Order cancellation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to restore inventory (updated to match admin refund API)
async function restoreInventory(items: OrderItem[], db: Db, orderId: string) {
  try {
    const productsCollection = db.collection<Product>('products');
    
    for (const item of items) {
      // Find the order item to get the current refunded quantity
      const order = await db.collection<{ items: OrderItem[] }>('orders').findOne(
        { 
          _id: new ObjectId(orderId),
          'items._id': item._id
        },
        { projection: { 'items.$': 1 } }
      );
      
      if (order && order.items && order.items.length > 0) {
        const orderItem = order.items[0];
        const quantityToRestore = orderItem.quantity - (orderItem.refundedQuantity || 0);
        
        if (quantityToRestore > 0) {
          await productsCollection.updateOne(
            { _id: new ObjectId(orderItem.productId) },
            { $inc: { stock: quantityToRestore } }
          );
        }
      }
    }
  } catch (error) {
    // Don't throw error as inventory restoration shouldn't block order cancellation
    console.error('Inventory restoration error:', error);
  }
}

// Helper function to send cancellation email
async function sendCancellationEmail(order: Order) {
  try {
    // Implement your email sending logic here
    // This could be through a service like SendGrid, Resend, etc.
    console.log(`Cancellation email would be sent for order ${order._id}`);
  } catch (error) {
    // Don't throw error as email failure shouldn't block order cancellation
    console.error('Email sending error:', error);
  }
}