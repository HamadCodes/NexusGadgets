import {NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { OrderItem } from '@/models/Order';
import authOptions from '@/lib/auth';

export async function GET() {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(); // your database name

    // Find orders for the current user
    const orders = await db
      .collection('orders')
      .find({ 
        'customer.id': new ObjectId(session.user.id) 
      })
      .sort({ orderDate: -1 }) // Sort by most recent first
      .toArray();

    // Convert ObjectId to string for serialization
    const serializedOrders = orders.map(order => ({
      ...order,
      _id: order._id.toString(),
      customer: {
        ...order.customer,
        id: order.customer.id.toString()
      },
      items: order.items.map((item: OrderItem) => ({
        ...item,
        _id: item._id.toString(),
        // Ensure refundedQuantity exists
        refundedQuantity: item.refundedQuantity || 0,
        // Ensure refundReason exists
        refundReason: item.refundReason || ''
      })),
      // Ensure refundedAmount exists
      refundedAmount: order.refundedAmount || 0
    }));

    return NextResponse.json({ orders: serializedOrders });
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' }, 
      { status: 500 }
    );
  }
}