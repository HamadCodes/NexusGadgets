import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ValidCategory } from '@/models/Product'
import { ObjectId } from 'mongodb'

// Define a Product interface for type safety
interface Product {
  _id: ObjectId;
  category?: ValidCategory;
  brand?: string;
  colors?: Array<{ name: string }>;
  storageOptions?: Array<{ storage: string }>;
  operatingSystem?: string;
  connectivity?: string;
  screenSize?: string;
  processor?: string;
  ram?: string;
  storageType?: string;
  compatibleOs?: string;
  batteryLife?: string;
  waterResistance?: string;
  type?: string;
  sensorResolution?: string;
  maxResolution?: string;
  storage?: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') as ValidCategory | null
    
    const client = await clientPromise
    const db = client.db()
    
    // Use a simple filter object instead of Filter<Document>
    const filter: { category?: ValidCategory } = {}
    if (category) filter.category = category
    
    // Common fields
    const [brands, colors] = await Promise.all([
      db.collection<Product>('products').distinct('brand', filter),
      db.collection<Product>('products').distinct('colors.name', filter)
    ])
    
    // Category-specific fields
    let categoryFilters: Record<string, string[]> = {}
    if (category) {
      switch (category) {
        case 'phones':
          categoryFilters = {
            storage: await db.collection<Product>('products').distinct('storageOptions.storage', filter) as string[],
            os: await db.collection<Product>('products').distinct('operatingSystem', filter) as string[],
            connectivity: await db.collection<Product>('products').distinct('connectivity', filter) as string[]
          }
          break
          
        case 'laptops':
          categoryFilters = {
            screenSize: await db.collection<Product>('products').distinct('screenSize', filter) as string[],
            processor: await db.collection<Product>('products').distinct('processor', filter) as string[],
            ram: await db.collection<Product>('products').distinct('ram', filter) as string[],
            storageType: await db.collection<Product>('products').distinct('storageType', filter) as string[]
          }
          break
          
        case 'smartwatches':
          categoryFilters = {
            os: await db.collection<Product>('products').distinct('compatibleOs', filter) as string[],
            batteryLife: await db.collection<Product>('products').distinct('batteryLife', filter) as string[],
            waterResistance: await db.collection<Product>('products').distinct('waterResistance', filter) as string[]
          }
          break
          
        case 'cameras':
          categoryFilters = {
            type: await db.collection<Product>('products').distinct('type', filter) as string[],
            resolution: await db.collection<Product>('products').distinct('sensorResolution', filter) as string[]
          }
          break
          
        case 'headphones':
          categoryFilters = {
            type: await db.collection<Product>('products').distinct('type', filter) as string[],
            noiseCancellation: ['true', 'false'],
            wireless: ['true', 'false']
          }
          break
          
        case 'consoles':
          categoryFilters = {
            storage: await db.collection<Product>('products').distinct('storage', filter) as string[],
            resolution: await db.collection<Product>('products').distinct('maxResolution', filter) as string[]
          }
          break
      }
    }
    
    return NextResponse.json({
      brands: (brands as string[]).sort(),
      colors: (colors as string[]).sort(),
      ...categoryFilters
    })
    
  } catch (error) {
    console.error('Failed to fetch filters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch filters' },
      { status: 500 }
    )
  }
}