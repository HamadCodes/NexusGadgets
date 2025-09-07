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
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json({ error: 'Image file required' }, { status: 400 });
    }

    if (imageFile.size > 1024 * 1024) {
      return NextResponse.json({ error: 'Image size exceeds 1MB' }, { status: 400 });
    }

    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Please select an image file' }, { status: 400 });
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const client = await clientPromise;
    const db = client.db();
    
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(session.user.id) },
      { 
        $set: { 
          imageBuffer: buffer,
          imageContentType: imageFile.type,
          image: null
        } 
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to update profile image' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch{
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}