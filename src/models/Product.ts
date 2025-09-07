import { ObjectId } from 'mongodb';
import { z } from 'zod';

export type ValidCategory = 
  | 'phones' 
  | 'laptops' 
  | 'smartwatches' 
  | 'cameras' 
  | 'headphones' 
  | 'consoles';

export type ProductSearchResult = {
  _id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  imageUrls: string[];
  brand: string;
  category: ValidCategory;
  reviewCount?: number;
  rating?: number;
};

  interface BaseProduct {
  _id: ObjectId | string;
  name: string;
  slug: string;
  brand: string;
  category: ValidCategory;
  description: string;
  shortDescription: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  colors: {
    name: string;
    hexCode: string;
  }[];
  imageUrls: string[];
  stockCount: number;
  reviewCount: number;
  totalRating: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhoneProduct extends BaseProduct {
  category: 'phones';
  storageOptions: {
    storage: string;
    price: number;
  }[];
  screenSize: string;
  processor: string;
  ram: string;
  cameraSpecs: string;
  batteryCapacity: string;
  operatingSystem: string;
  connectivity: string[];
}

export interface LaptopProduct extends BaseProduct {
  category: 'laptops';
  screenSize: string;
  resolution: string;
  processor: string;
  ram: string;
  storageType: 'SSD' | 'HDD' | 'Hybrid';
  storageSize: string;
  gpu: string;
  os: string;
  weight: string;
  ports: string[];
}

export interface SmartwatchProduct extends BaseProduct {
  category: 'smartwatches';
  screenSize: string;
  resolution: string;
  batteryLife: string;
  compatibleOs: string[];
  healthFeatures: string[];
  waterResistance: string;
  connectivity: string[];
}

export interface CameraProduct extends BaseProduct {
  category: 'cameras';
  sensorResolution: string;
  lensMount: string;
  isoRange: string;
  videoResolution: string;
  screenSize: string;
  weight: string;
  type: 'DSLR' | 'Mirrorless' | 'PointAndShoot';
}

export interface HeadphoneProduct extends BaseProduct {
  category: 'headphones';
  type: 'over-ear' | 'on-ear' | 'in-ear';
  wireless: boolean;
  batteryLife?: string;
  noiseCancellation: boolean;
  connectivity: string[];
  impedance: string;
}

export interface ConsoleProduct extends BaseProduct {
  category: 'consoles';
  storage: string;
  maxResolution: string;
  onlinePlay: boolean;
  includedAccessories: string[];
  controllerType: string;
  cpu: string;
  gpu: string;
}

export type Product = 
  | PhoneProduct 
  | LaptopProduct 
  | SmartwatchProduct 
  | CameraProduct 
  | HeadphoneProduct 
  | ConsoleProduct;



// Base schema for common product fields
export const baseProductSchema = z.object({
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
export const phoneSchema = baseProductSchema.extend({
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

export const laptopSchema = baseProductSchema.extend({
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

export const smartwatchSchema = baseProductSchema.extend({
  category: z.literal('smartwatches'),
  screenSize: z.string().min(1, 'Screen size is required'),
  resolution: z.string().min(1, 'Resolution is required'),
  batteryLife: z.string().min(1, 'Battery life is required'),
  compatibleOs: z.array(z.string()).min(0).optional(),
  healthFeatures: z.array(z.string()).min(0).optional(),
  waterResistance: z.string().min(1, 'Water resistance is required'),
  connectivity: z.array(z.string()).min(0).optional(),
});

export const cameraSchema = baseProductSchema.extend({
  category: z.literal('cameras'),
  sensorResolution: z.string().min(1, 'Sensor resolution is required'),
  lensMount: z.string().min(1, 'Lens mount is required'),
  isoRange: z.string().min(1, 'ISO range is required'),
  videoResolution: z.string().min(1, 'Video resolution is required'),
  screenSize: z.string().min(1, 'Screen size is required'),
  weight: z.string().min(1, 'Weight is required'),
  type: z.string().min(1, 'Camera type is required'),
});

export const headphoneSchema = baseProductSchema.extend({
  category: z.literal('headphones'),
  type: z.string().min(1, 'Headphone type is required'),
  wireless: z.boolean(),
  batteryLife: z.string().optional(),
  noiseCancellation: z.boolean(),
  connectivity: z.array(z.string()).min(0).optional(),
  impedance: z.string().min(1, 'Impedance is required'),
});

export const consoleSchema = baseProductSchema.extend({
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
export const productSchema = z.discriminatedUnion('category', [
  phoneSchema,
  laptopSchema,
  smartwatchSchema,
  cameraSchema,
  headphoneSchema,
  consoleSchema
]);

export type ProductForm = z.infer<typeof productSchema>;
export type ProductCategory = ProductForm['category'];

// Image Preview Type
export type ImagePreview = {
  url: string;
  type: 'existing' | 'new';
};

// Form field option type
export interface Option {
  value: string;
  label: React.ReactNode;
}

// Component props
export interface ProductFormProps {
  mode: 'create' | 'edit';
  initialData?: ProductForm & { _id?: string; imageUrls?: string[] };
}