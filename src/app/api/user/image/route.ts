// api/user/image/route.ts (remove the [userId] parameter)
import {NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import authOptions from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.error('Unauthorized: No session or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(session.user.id) },
      { projection: { imageBuffer: 1, imageContentType: 1 } }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.imageBuffer) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    
    // Convert MongoDB Binary to Buffer
    let buffer;
    if (user.imageBuffer instanceof Buffer) {
      buffer = user.imageBuffer;
    } else if (user.imageBuffer.buffer) {
      // Handle Binary type from MongoDB
      buffer = Buffer.from(user.imageBuffer.buffer);
    } else {
      console.error('Unknown image buffer type:', typeof user.imageBuffer);
      return NextResponse.json({ error: 'Invalid image format' }, { status: 500 });
    }

    // Create a response with the image data
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': user.imageContentType || 'image/jpeg',
        'Cache-Control': 'no-store, max-age=0',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Image fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
}