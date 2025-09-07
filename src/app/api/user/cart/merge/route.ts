// app/api/user/cart/merge/route.ts
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

  try {
    const { items } = await req.json() as { items?: CartItem[] };
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const userId = new ObjectId(session.user.id);

    // Get current user cart
    const user = await db.collection<UserDocument>('users').findOne({ _id: userId });
    const currentCart: CartItem[] = user?.cart || [];

    // Merge logic: for items with same key, sum quantities
    const mergedCart: CartItem[] = [...currentCart];
    
    for (const localItem of items) {
      // Find if this item already exists in the cart
      const existingIndex = mergedCart.findIndex(item => {
        const colorMatch = item.color.name === localItem.color.name;
        const productMatch = item.productId === localItem.productId;
        
        // Handle storage matching
        let storageMatch = false;
        if (localItem.storage && item.storage) {
          storageMatch = item.storage.storage === localItem.storage.storage;
        } else if (!localItem.storage && !item.storage) {
          storageMatch = true;
        }
        
        return colorMatch && productMatch && storageMatch;
      });

      if (existingIndex >= 0) {
        // Item exists, update quantity
        mergedCart[existingIndex].quantity += localItem.quantity;
      } else {
        // New item, add to cart
        mergedCart.push(localItem);
      }
    }

    // Update user cart in database
    await db.collection<UserDocument>('users').updateOne(
      { _id: userId },
      { $set: { cart: mergedCart } }
    );

    return NextResponse.json({ 
      message: 'Cart merged successfully', 
      cart: mergedCart 
    }, { status: 200 });
  } catch (error) {
    console.error('Cart merge error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}