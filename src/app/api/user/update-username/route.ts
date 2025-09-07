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
    const { username } = await req.json();
    
    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    if (username.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters long' }, { status: 400 });
    }

    if (username.length > 30) {
      return NextResponse.json({ error: 'Username cannot exceed 30 characters' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    const existingUser = await db.collection('users').findOne({
      name: username,
      _id: { $ne: new ObjectId(session.user.id) }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
    }

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: { name: username } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to update username' }, { status: 500 });
    }

    return NextResponse.json({ success: true, username: username });
  } catch{
    return NextResponse.json({ error: 'Failed to update username' }, { status: 500 });
  }
}