import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { Product } from '@/models/Product';
import { z } from 'zod';
import { MongoError, ObjectId } from 'mongodb';
import { rateLimit } from '@/lib/rate-limit';
import authOptions from '@/lib/auth';

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
});

// Base schema for common product fields
const baseProductSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  slug: z.string().min(3, 'Slug must be at least 3 characters'),
  brand: z.string().min(1, 'Brand is required'),
  description: z.string().min(1, 'Description is required'),
  shortDescription: z.string().min(1, 'Short description is required'),
  price: z.number().positive('Price must be positive'),
  originalPrice: z.number().optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  colors: z.array(z.object({
    name: z.string().min(1, 'Color name is required'),
    hexCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  })).min(1, 'At least one color is required'),
  imageUrls: z.array(z.string().url('Invalid URL format')).min(1, 'At least one image URL is required'),
  stockCount: z.number().min(0, 'Stock count cannot be negative'),
});

// Category-specific schemas
const phoneSchema = baseProductSchema.extend({
  category: z.literal('phones'),
  storageOptions: z.array(
    z.object({
      storage: z.string().min(1, 'Storage option is required'),
      price: z.number().min(0, 'Price must be non-negative'),
    })
  ).min(1, 'At least one storage option is required'),
  screenSize: z.string().min(1, 'Screen size is required'),
  processor: z.string().min(1, 'Processor is required'),
  ram: z.string().min(1, 'RAM is required'),
  cameraSpecs: z.string().min(1, 'Camera specifications are required'),
  batteryCapacity: z.string().min(1, 'Battery capacity is required'),
  operatingSystem: z.string().min(1, 'Operating system is required'),
  connectivity: z.array(z.string()).min(0).optional(),
});

const laptopSchema = baseProductSchema.extend({
  category: z.literal('laptops'),
  screenSize: z.string().min(1, 'Screen size is required'),
  resolution: z.string().min(1, 'Resolution is required'),
  processor: z.string().min(1, 'Processor is required'),
  ram: z.string().min(1, 'RAM is required'),
  storageType: z.enum(['SSD', 'HDD', 'Hybrid']),
  storageSize: z.string().min(1, 'Storage size is required'),
  gpu: z.string().min(1, 'GPU is required'),
  os: z.string().min(1, 'OS is required'),
  weight: z.string().min(1, 'Weight is required'),
  ports: z.array(z.string()).min(0).optional(),
});

const smartwatchSchema = baseProductSchema.extend({
  category: z.literal('smartwatches'),
  screenSize: z.string().min(1, 'Screen size is required'),
  resolution: z.string().min(1, 'Resolution is required'),
  batteryLife: z.string().min(1, 'Battery life is required'),
  compatibleOs: z.array(z.string()).min(0).optional(),
  healthFeatures: z.array(z.string()).min(0).optional(),
  waterResistance: z.string().min(1, 'Water resistance is required'),
  connectivity: z.array(z.string()).min(0).optional(),
});

const cameraSchema = baseProductSchema.extend({
  category: z.literal('cameras'),
  sensorResolution: z.string().min(1, 'Sensor resolution is required'),
  lensMount: z.string().min(1, 'Lens mount is required'),
  isoRange: z.string().min(1, 'ISO range is required'),
  videoResolution: z.string().min(1, 'Video resolution is required'),
  screenSize: z.string().min(1, 'Screen size is required'),
  weight: z.string().min(1, 'Weight is required'),
  type: z.string().min(1, 'Camera type is required'),
});

const headphoneSchema = baseProductSchema.extend({
  category: z.literal('headphones'),
  type: z.string().min(1, 'Headphone type is required'),
  wireless: z.boolean(),
  batteryLife: z.string().optional(),
  noiseCancellation: z.boolean(),
  connectivity: z.array(z.string()).min(0).optional(),
  impedance: z.string().min(1, 'Impedance is required'),
});

const consoleSchema = baseProductSchema.extend({
  category: z.literal('consoles'),
  storage: z.string().min(1, 'Storage is required'),
  maxResolution: z.string().min(1, 'Max resolution is required'),
  onlinePlay: z.boolean(),
  includedAccessories: z.array(z.string()).min(0).optional(),
  controllerType: z.string().min(1, 'Controller type is required'),
  cpu: z.string().min(1, 'CPU is required'),
  gpu: z.string().min(1, 'GPU is required'),
});

// Discriminated union for all product types
const productSchema = z.discriminatedUnion('category', [
  phoneSchema,
  laptopSchema,
  smartwatchSchema,
  cameraSchema,
  headphoneSchema,
  consoleSchema
]);

// Create a type for the product we're inserting that matches the Product model
type ProductInsert = Omit<Product, '_id' | 'totalRating'> & {
  _id?: ObjectId;
  totalRating?: number;
  createdAt: Date;
  updatedAt: Date;
  rating: number;
  reviewCount: number;
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const identifier = session.user.id;
    const { success } = await limiter.check(identifier, 5);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const productData: unknown = await req.json();
    
    const validation = productSchema.safeParse(productData);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid data', 
        details: validation.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const now = new Date();
    
    // Create a product object that matches the ProductInsert type
    const product: ProductInsert = {
      ...validation.data,
      createdAt: now,
      updatedAt: now,
      rating: 0,
      reviewCount: 0,
      // Add any missing properties that might be required by the Product type
      totalRating: 0,
    };

    const result = await db.collection<Product>('products').insertOne(product as Product);
    
    return NextResponse.json({ 
      success: true, 
      productId: result.insertedId 
    }, { status: 201 });
    
  } catch (error: unknown) {
    console.error('Error creating product:', error);
    
    if (error instanceof MongoError && error.message.includes('duplicate key')) {
      return NextResponse.json({ 
        error: 'Product with this name already exists' 
      }, { status: 409 });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? errorMessage : 'Something went wrong'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    const products = await db.collection('products')
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json({ products });
  } catch{
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}