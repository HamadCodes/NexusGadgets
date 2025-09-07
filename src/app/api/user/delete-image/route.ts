import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import authOptions from '@/lib/auth';

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(session.user.id) },
      { 
        $unset: { 
          imageBuffer: "",
          imageContentType: ""
        } 
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to delete profile image' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch{
    return NextResponse.json({ error: 'Failed to delete profile image' }, { status: 500 });
  }
}