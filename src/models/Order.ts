// models/Orders.ts
import { ObjectId } from 'mongodb';

export interface OrderItem {
  _id: ObjectId;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  color?: {
    name: string;
    hexCode: string;
  };
  storage?: {
    storage: string;
    price: number;
  };
  imageUrl: string;
  delivered: boolean;
  deliveredAt?: Date;
  refundedQuantity: number; // Added for tracking refunded items
  refundReason?: string; // Added for tracking refund reasons
  lastRefundedAt?: Date; // Added for tracking when item was last refunded
}

export interface RefundItem {
  itemId: string;
  quantity: number;
  reason?: string;
}

export interface RefundRecord {
  id: string; // Stripe refund ID
  amount: number;
  reason: string;
  stripeReason: string;
  createdAt: Date;
  items: RefundItem[];
  processedBy: string;
}

export interface Order {
  _id: ObjectId;
  customer: {
    id: ObjectId;
    name: string;
    email: string;
    phone: string;
    vatNumber?: string;
    vatValid?: boolean;
    guest?: boolean;
  };
  orderNumber: string;
  orderDate: Date;
  status: string;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  taxRate: number;
  discount: number;
  total: number;
  currency: string;
  items: OrderItem[];
  shippingAddress: {
    city: string;
    country: string;
    line1: string;
    line2?: string;
    postal_code: string;
    state: string;
  };
  shippingMethod: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  paymentMethod: string;
  paymentStatus: string;
  paymentIntentId?: string;
  transactionId?: string;
  notes?: string;
  source: string;
  ipAddress: string;
  userAgent: string;
  vatValid?: boolean;
  createdAt: Date;
  updatedAt: Date;
  refunded?: boolean; 
  refundId?: string; 
  refundedAmount: number;
  refundedAt?: Date; 
  partiallyRefunded?: boolean; 
  refunds: RefundRecord[]; 
}