import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { CartItem } from '@/hooks/useCart';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') || '';
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentIntentSucceeded(paymentIntent);
      break;
    case 'payment_intent.payment_failed':
      const paymentFailed = event.data.object as Stripe.PaymentIntent;
      console.error(`Payment failed: ${paymentFailed.id}`);
      break;
    // Add handlers for refund-related events to prevent "Unhandled event type" messages
    case 'refund.created':
    case 'charge.refunded':
    case 'refund.updated':
    case 'charge.refund.updated':
      // These events are expected during refunds but don't require specific handling
      // since we're already processing refunds in our admin API
      break;
    default:
      // Only log unhandled events that aren't refund-related
      if (!event.type.includes('refund')) {
        console.log(`Unhandled event type: ${event.type}`);
      }
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const client = await clientPromise;
  const db = client.db();
  const userId = paymentIntent.metadata.userId;
  
  if (!userId) {
    console.error('No userId in payment intent metadata');
    return;
  }

  try {
    // Parse metadata
    const metadata = paymentIntent.metadata;
    const cart = JSON.parse(metadata.cart || '[]');
    const subtotal = parseFloat(metadata.subtotal || '0');
    const shippingCost = parseFloat(metadata.shippingCost || '0');
    const taxAmount = parseFloat(metadata.taxAmount || '0');
    const taxRate = parseFloat(metadata.taxRate || '0');
    const vatValid = metadata.vatValid === 'true'; // Convert to boolean

    // Get products from database
    const productIds = cart.map((item: CartItem) => new ObjectId(item.productId));
    const products = await db.collection('products')
      .find({ _id: { $in: productIds } })
      .toArray();

    // Generate order number
    const orderNumber = generateOrderNumber();
    
    // Create comprehensive order
    const order = {
      // Customer Information
      customer: {
        id: new ObjectId(userId),
        name: paymentIntent.shipping?.name || '',
        email: paymentIntent.receipt_email || '',
        phone: paymentIntent.shipping?.phone || '',
        vatNumber: metadata.vatNumber || '',
        vatValid, // Store validation status
        guest: false,
      },
      
      // Order Details
      orderNumber,
      orderDate: new Date(),
      status: 'processing',
      
      // Financial Information
      subtotal,
      shippingCost,
      taxAmount,
      taxRate,
      discount: 0,
      total: paymentIntent.amount,
      currency: paymentIntent.currency,
      
      // Product Details
      items: cart.map((item: CartItem) => {
        const product = products.find(p => p._id.equals(new ObjectId(item.productId)));
        return {
          _id: new ObjectId(), // Unique ID for each item
          productId: item.productId,
          name: product?.name || 'Unknown Product',
          price: product?.price || 0,
          quantity: item.quantity || 1,
          color: item.color,
          storage: item.storage,
          imageUrl: product?.imageUrls?.[0] || '',
          delivered: false, // Initial delivery status
          deliveredAt: null, // Delivery timestamp
          refundedQuantity: 0, // Initialize refunded quantity
          refundReason: '' // Initialize refund reason
        };
      }),
      
      // Shipping Information
      shippingMethod: metadata.shippingMethod,
      shippingAddress: paymentIntent.shipping?.address || {},
      trackingNumber: '',
      estimatedDelivery: calculateDeliveryDate(metadata.shippingMethod),
      
      // Payment Details
      paymentMethod: paymentIntent.payment_method_types?.[0] || 'card',
      paymentStatus: paymentIntent.status,
      paymentIntentId: paymentIntent.id,
      transactionId: paymentIntent.latest_charge as string || '',
      
      // Additional Metadata
      notes: metadata.notes || '',
      source: 'web',
      ipAddress: metadata.clientIp || '',
      userAgent: metadata.userAgent || '',
      vatValid, // Also store at the root for easy access
      
      // Refund Information
      refundedAmount: 0, // Initialize refunded amount
      partiallyRefunded: false, // Initialize partially refunded status
      refunds: [], // Initialize refunds array
      
      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save order to database
    await db.collection('orders').insertOne(order);

    // Clear user's cart
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { cart: [] } }
    );

    console.log(`Order created: ${order.orderNumber}`);

  } catch (error) {
    console.error('Error handling payment_intent.succeeded:', error);
  }
}

// Helper functions
function generateOrderNumber(): string {
  const date = new Date();
  const datePart = date.toISOString().slice(2, 10).replace(/-/g, '');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${datePart}-${randomPart}`;
}

function calculateDeliveryDate(shippingMethod: string): Date {
  const deliveryDays: Record<string, number> = {
    standard: 7,
    express: 3,
    overnight: 1
  };
  
  const date = new Date();
  date.setDate(date.getDate() + (deliveryDays[shippingMethod] || 7));
  return date;
}