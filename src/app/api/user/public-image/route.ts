import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const usersCollection = await getCollection('users');
    const user = await usersCollection.findOne({ 
      _id: new ObjectId(userId) 
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has an uploaded image
    if (user.imageBuffer) {
      // Convert buffer to base64
      const base64Image = user.imageBuffer.toString('base64');
      const contentType = user.imageContentType || 'image/jpeg';

      return new NextResponse(Buffer.from(base64Image, 'base64'), {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        },
      });
    }

    // If no uploaded image, check for OAuth image
    if (user.image) {
      // For OAuth images, redirect to the source
      return NextResponse.redirect(user.image);
    }

    // If no image, return 404
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching user image:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}