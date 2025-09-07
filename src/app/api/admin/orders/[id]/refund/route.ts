import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getDb } from '@/lib/mongodb';
import { ObjectId, Db, UpdateFilter } from 'mongodb';
import { stripe } from '@/lib/stripe';
import { Order, OrderItem, RefundRecord, RefundItem } from '@/models/Order';
import Stripe from 'stripe';
import authOptions from '@/lib/auth';

interface RefundRequest {
  items: RefundItem[];
  amount?: number;
  reason?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await getDb();
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const refundRequest: RefundRequest = await request.json();
    
    if ((!refundRequest.items || refundRequest.items.length === 0) && !refundRequest.amount) {
      return NextResponse.json(
        { error: 'Either items or amount must be specified for refund' },
        { status: 400 }
      );
    }

    const order = await db.collection<Order>('orders').findOne({ 
      _id: new ObjectId(id)
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.paymentStatus !== 'succeeded' || !order.paymentIntentId) {
      return NextResponse.json(
        { error: 'Order cannot be refunded. Payment was not successful or payment intent is missing.' },
        { status: 400 }
      );
    }

    let refundAmountInCents = 0;
    
    if (refundRequest.amount) {
      refundAmountInCents = Math.round(refundRequest.amount * 100);
    } else if (refundRequest.items && refundRequest.items.length > 0) {
      for (const refundItem of refundRequest.items) {
        const orderItem = order.items.find(item => 
          item._id.toString() === refundItem.itemId
        );
        
        if (!orderItem) {
          return NextResponse.json(
            { error: `Item with ID ${refundItem.itemId} not found in order` },
            { status: 400 }
          );
        }
        
        const availableQty = orderItem.quantity - orderItem.refundedQuantity;
        if (refundItem.quantity > availableQty) {
          return NextResponse.json(
            { error: `Requested quantity (${refundItem.quantity}) exceeds available quantity (${availableQty}) for item ${orderItem.name}` },
            { status: 400 }
          );
        }
        
        const itemTotal = orderItem.price * 100 * refundItem.quantity;
        const itemProportion = (orderItem.price * refundItem.quantity) / order.subtotal;
        const itemTax = order.taxAmount * 100 * itemProportion;
        const itemShipping = order.shippingCost * 100 * itemProportion;
        
        refundAmountInCents += Math.round(itemTotal + itemTax + itemShipping);
      }
    }

    if (refundAmountInCents <= 0) {
      return NextResponse.json(
        { error: 'Refund amount must be greater than zero' },
        { status: 400 }
      );
    }

    const alreadyRefundedInCents = order.refundedAmount * 100;
    const maxRefundable = order.total - alreadyRefundedInCents;
    
    if (refundAmountInCents > maxRefundable) {
      return NextResponse.json(
        { error: `Refund amount exceeds maximum refundable amount of $${(maxRefundable / 100).toFixed(2)}` },
        { status: 400 }
      );
    }

    let refund: Stripe.Response<Stripe.Refund>;
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: order.paymentIntentId,
        amount: refundAmountInCents,
        reason: 'requested_by_customer',
        metadata: {
          orderId: id,
          refundType: refundRequest.items ? 'items' : 'amount',
          processedBy: session.user.email!,
          customReason: refundRequest.reason || 'Admin initiated refund'
        }
      };
      
      refund = await stripe.refunds.create(refundParams);
    } catch (stripeError) {
      console.error('Stripe refund error:', stripeError);
      return NextResponse.json(
        { error: `Failed to process refund with Stripe: ${stripeError instanceof Error ? stripeError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

    const refundAmountInDollars = refundAmountInCents / 100;
    const newRefundedAmount = order.refundedAmount + refundAmountInDollars;
    const totalOrderAmountInDollars = order.total / 100;
    
    const refundRecord: RefundRecord = {
      id: refund.id,
      amount: refundAmountInDollars,
      reason: refundRequest.reason || (refundRequest.amount ? 'Full refund by admin' : 'Partial refund by admin'),
      stripeReason: refund.reason || '',
      createdAt: new Date(),
      items: refundRequest.items || [],
      processedBy: session.user.email!
    };
    
    // Create update data with proper typing
    const updateSet: Partial<Order> = {
      updatedAt: new Date(),
      refundedAmount: newRefundedAmount
    };

    if (newRefundedAmount >= totalOrderAmountInDollars) {
      updateSet.refunded = true;
      updateSet.status = 'refunded';
      updateSet.partiallyRefunded = false;
    } else if (newRefundedAmount > 0) {
      updateSet.partiallyRefunded = true;
      updateSet.status = 'partially_refunded';
    }

    // Use a type-safe approach for the update
    const result = await db.collection('orders').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: updateSet,
        $push: { refunds: refundRecord }
      } as UpdateFilter<Order>
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update order with refund details' },
        { status: 500 }
      );
    }

    if ((refundRequest.items && refundRequest.items.length > 0) || refundRequest.amount) {
      let itemsToUpdate: Array<{itemId: string, quantity: number, reason: string}> = [];
      
      if (refundRequest.amount) {
        itemsToUpdate = order.items.map(item => ({
          itemId: item._id.toString(),
          quantity: item.quantity - item.refundedQuantity,
          reason: refundRequest.reason || 'Full refund'
        }));
      } else {
        itemsToUpdate = refundRequest.items.map(refundItem => ({
          itemId: refundItem.itemId,
          quantity: refundItem.quantity,
          reason: refundItem.reason || refundRequest.reason || 'Partial refund'
        }));
      }
      
      for (const itemUpdate of itemsToUpdate) {
        await db.collection('orders').updateOne(
          { 
            _id: new ObjectId(id),
            'items._id': new ObjectId(itemUpdate.itemId)
          },
          { 
            $inc: { 
              'items.$.refundedQuantity': itemUpdate.quantity
            },
            $set: {
              'items.$.refundReason': itemUpdate.reason,
              'items.$.lastRefundedAt': new Date()
            }
          }
        );
      }
    }

    if ((refundRequest.items && refundRequest.items.length > 0) || refundRequest.amount) {
      let itemsToRestore: Array<{itemId: string, quantity: number}> = [];
      
      if (refundRequest.amount) {
        itemsToRestore = order.items.map(item => ({
          itemId: item._id.toString(),
          quantity: item.quantity - item.refundedQuantity
        }));
      } else {
        itemsToRestore = refundRequest.items.map(refundItem => ({
          itemId: refundItem.itemId,
          quantity: refundItem.quantity
        }));
      }
      
      await restoreInventory(itemsToRestore, db, id);
    }

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      amount: refundAmountInDollars,
      message: `Successfully processed refund of $${refundAmountInDollars.toFixed(2)}`
    });

  } catch (error) {
    console.error('Refund processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function restoreInventory(
  items: Array<{itemId: string, quantity: number}>, 
  db: Db, 
  orderId: string
) {
  try {
    const productsCollection = db.collection('products');
    
    for (const item of items) {
      const order = await db.collection('orders').findOne(
        { 
          _id: new ObjectId(orderId),
          'items._id': new ObjectId(item.itemId)
        },
        { projection: { 'items.$': 1 } }
      );
      
      if (order && order.items && order.items.length > 0) {
        const orderItem = order.items[0] as OrderItem;
        await productsCollection.updateOne(
          { _id: new ObjectId(orderItem.productId) },
          { $inc: { stock: item.quantity } }
        );
      }
    }
  } catch (error) {
    console.error('Inventory restoration error:', error);
  }
}