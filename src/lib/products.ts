import clientPromise from './mongodb';
import { Product, ValidCategory } from '@/models/Product';

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const client = await clientPromise;
  const db = client.db();
  return await db.collection('products').findOne({ slug }) as Product | null;
}

export async function getProductsAndFilterOptionsByCategory(
  category: ValidCategory,
  filters: { [key: string]: string | string[] | undefined } = {},
  page: number = 1,
  limit: number = 12
) {
  const client = await clientPromise;
  const db = client.db();
  
  // Build filter query - use Record<string, unknown> instead of any
  const query: Record<string, unknown> = { category };
  
  // Handle price filter
  if (filters.price) {
    const priceRanges = Array.isArray(filters.price) 
      ? filters.price 
      : [filters.price];
    
    const priceConditions: { price: { $gte?: number; $lt?: number } }[] = [];
    
    for (const range of priceRanges) {
      const [minStr, maxStr] = range.split('-');
      const min = parseInt(minStr);
      
      if (maxStr === '+') {
        priceConditions.push({ price: { $gte: min } });
      } else if (maxStr) {
        const max = parseInt(maxStr);
        priceConditions.push({ price: { $gte: min, $lt: max } });
      } else {
        priceConditions.push({ price: { $gte: min } });
      }
    }
    
    if (priceConditions.length > 0) {
      // Use type assertion for $or since we know its structure
      (query as { $or?: unknown[] }).$or = [
        ...((query as { $or?: unknown[] }).$or || []),
        ...priceConditions
      ];
    }
  }
  
  // Handle multi-select filters
  const multiSelectFilters = [
    'brand', 'os', 'connectivity', 
    'storageType', 'type'
  ];
  
  multiSelectFilters.forEach(key => {
    if (filters[key]) {
      const values = Array.isArray(filters[key]) ? filters[key] : [filters[key]];
      query[key] = { $in: values };
    }
  });
  
  // Handle select filters
  const selectFilters = [
    'screenSize', 'processor', 'ram', 'batteryLife',
    'waterResistance', 'resolution'
  ];
  
  selectFilters.forEach(key => {
    if (filters[key]) {
      query[key] = filters[key];
    }
  });
  
  // Handle boolean filters
  if (filters.noiseCancellation) {
    query.noiseCancellation = filters.noiseCancellation === 'true';
  }
  if (filters.wireless) {
    query.wireless = filters.wireless === 'true';
  }
  
  // Handle color filter (nested field)
  if (filters.color) {
    const colors = Array.isArray(filters.color) ? filters.color : [filters.color];
    query['colors.name'] = { $in: colors };
  }
  
  // Handle storage filter - special case for phones
  if (filters.storage) {
    const storageValues = Array.isArray(filters.storage) 
      ? filters.storage 
      : [filters.storage];
    
    // Create regex patterns for flexible matching
    const regexPatterns = storageValues.map(value => 
      new RegExp(`^${value.replace(/\s+/g, '\\s*')}$`, 'i')
    );
    
    // Category-specific storage field handling
    if (category === 'phones') {
      query['storageOptions.storage'] = { $in: regexPatterns };
    } 
    else if (category === 'laptops') {
      query['storageSize'] = { $in: regexPatterns };
    }
    else if (category === 'consoles') {
      query['storage'] = { $in: regexPatterns };
    }
  }
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Fetch products
  const products = await db.collection<Product>('products')
    .find(query)
    .skip(skip)
    .limit(limit)
    .project({
      name: 1,
      slug: 1,
      price: 1,
      orignalPrice: 1,
      imageUrls: 1,
      brand: 1,
      category: 1,
      shortDescription: 1,
      rating: 1,
      reviewCount: 1
    })
    .toArray() as Product[];

  // Get total count for pagination
  const total = await db.collection('products').countDocuments(query);

  // Get distinct filter options
  const distinct = async (field: string) => {
    return db.collection('products').distinct(field, { category });
  };

  // Category-specific filter fields
  const filterFields: Record<ValidCategory, string[]> = {
    phones: ['brand', 'operatingSystem', 'screenSize', 'colors.name', 'storageOptions.storage'],
    laptops: ['brand', 'ram', 'storageSize', 'processor', 'screenSize'],
    smartwatches: ['brand', 'screenSize', 'batteryLife', 'waterResistance', 'colors.name'],
    cameras: ['brand', 'type', 'sensorResolution', 'videoResolution', 'lensMount'],
    headphones: ['brand', 'type', 'colors.name'],
    consoles: ['brand', 'storage', 'maxResolution', 'colors.name']
  };

  // Get filter options
  const filterOptions: Record<string, string[]> = {};
  
  for (const field of filterFields[category]) {
    try {
      const values = await distinct(field);
      
      // Clean and sort values
      const uniqueValues = [...new Set(values
        .map(v => v?.toString()?.trim())
        .filter(v => v && v !== 'undefined')
        .sort())];
      
      // Map to UI-friendly keys
      const key = field === 'colors.name' ? 'color' 
                : field === 'storageOptions.storage' ? 'storage' 
                : field;
      
      filterOptions[key] = uniqueValues;
    } catch (e) {
      console.error(`Error fetching distinct values for ${field}:`, e);
    }
  }

  // Add price ranges
  filterOptions.price = [
    '0-500', '500-1000', '1000-1500', '1500-2000', '2000-3000', '3000+'
  ];

  return { 
    products, 
    filterOptions, 
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}