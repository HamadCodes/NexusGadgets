import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getCollection } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import authOptions from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ordersCollection = await getCollection<Order>('orders');
    const orders = await ordersCollection.find().sort({ orderDate: -1 }).limit(50).toArray();
    
    return NextResponse.json({ orders });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}