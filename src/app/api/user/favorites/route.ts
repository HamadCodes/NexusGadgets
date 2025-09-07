import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import authOptions from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(session.user.id) },
      { $addToSet: { favorites: productId } }
    );

    return NextResponse.json({ 
      success: result.modifiedCount > 0,
      message: result.modifiedCount > 0 
        ? 'Product added to favorites' 
        : 'Product already in favorites'
    });
  } catch (error) {
    console.error('POST /api/user/favorites error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(session.user.id) },
      { $pull: { favorites: productId } }
    );

    return NextResponse.json({ 
      success: result.modifiedCount > 0,
      message: result.modifiedCount > 0 
        ? 'Product removed from favorites' 
        : 'Product not found in favorites'
    });
  } catch (error) {
    console.error('DELETE /api/user/favorites error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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
      .collection('users')
      .findOne(
        { _id: new ObjectId(session.user.id) },
        { projection: { favorites: 1 } }
      );

    const favorites: string[] = Array.isArray(userDoc?.favorites)
      ? userDoc.favorites
      : [];

    return NextResponse.json({ favorites }, { status: 200 });
  } catch (error) {
    console.error('GET /api/user/favorites error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}