import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import authOptions from '@/lib/auth';

interface CartItem {
  productId: string;
  color: { name: string; hexCode: string };
  storage?: { storage: string; price: number };
  quantity: number;
}

interface UserDocument {
  _id: ObjectId;
  cart?: CartItem[];
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { productId, color, storage, quantity = 1 }: Partial<CartItem> & { quantity?: number } = await req.json();
  if (!productId || !color) {
    return NextResponse.json({ error: 'Product ID and color are required' }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();
  const userId = new ObjectId(session.user.id);

  // Create cart item object
  const cartItem: CartItem = { 
    productId, 
    color,
    quantity
  };
  
  if (storage) {
    cartItem.storage = storage;
  }

  // Find existing item
  const existingQuery = {
    _id: userId,
    "cart": {
      $elemMatch: {
        productId,
        "color.name": color.name,
        ...(storage ? { "storage.storage": storage.storage } : { storage: { $exists: false } })
      }
    }
  };

  const existing = await db.collection<UserDocument>('users').countDocuments(existingQuery);
  
  if (existing) {
    // Update quantity if exists
    const result = await db.collection<UserDocument>('users').updateOne(
      existingQuery,
      { $inc: { "cart.$.quantity": quantity } }
    );
    return NextResponse.json({ success: result.modifiedCount > 0 });
  } else {
    // Add new item
    const result = await db.collection<UserDocument>('users').updateOne(
      { _id: userId },
      { $push: { cart: cartItem } }
    );
    return NextResponse.json({ success: result.modifiedCount > 0 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { productId, color, storage, quantity }: CartItem = await req.json();
  if (!productId || !color || quantity === undefined) {
    return NextResponse.json({ error: 'Product ID, color and quantity are required' }, { status: 400 });
  }

  if (quantity < 1) {
    return NextResponse.json({ error: 'Quantity must be at least 1' }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();
  const userId = new ObjectId(session.user.id);

  // Build query to find specific cart item
  const itemQuery = {
    _id: userId,
    "cart": {
      $elemMatch: {
        productId,
        "color.name": color.name,
        ...(storage ? { "storage.storage": storage.storage } : { storage: { $exists: false } })
      }
    }
  };

  // Update quantity
  const result = await db.collection<UserDocument>('users').updateOne(
    itemQuery,
    { $set: { "cart.$.quantity": quantity } }
  );

  if (result.modifiedCount === 0) {
    return NextResponse.json({ error: 'Item not found or quantity unchanged' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { productId, color, storage }: Partial<CartItem> = await req.json();
  if (!productId || !color) {
    return NextResponse.json({ error: 'Product ID and color are required' }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();
  const userId = new ObjectId(session.user.id);
  
  // Create cart item object for removal
  const cartItem: Record<string, unknown> = { 
    productId, 
    "color.name": color.name
  };
  
  if (storage) {
    cartItem["storage.storage"] = storage.storage;
  }
  
  const result = await db.collection<UserDocument>('users').updateOne(
    { _id: userId },
    { $pull: { cart: cartItem } }
  );

  if (result.modifiedCount === 0) {
    return NextResponse.json({ error: 'Item not found in cart' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const userDoc = await db
      .collection<UserDocument>('users')
      .findOne(
        { _id: new ObjectId(session.user.id) },
        { projection: { cart: 1 } }
      );

    const cart: CartItem[] = userDoc?.cart || [];

    return NextResponse.json({ cart }, { status: 200 });
  } catch (error) {
    console.error('GET /api/user/cart error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}