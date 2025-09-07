import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from 'date-fns';
import { Order, OrderItem } from "@/models/Order";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}


export const formatDateSafely = (dateString: string | Date | undefined, formatString: string) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return format(date, formatString);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
};

export const getStatusConfig = (status: string) => {
  const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'success', label: string }> = {
    'processing': { variant: 'secondary', label: 'Processing' },
    'shipped': { variant: 'outline', label: 'Shipped' },
    'delivered': { variant: 'default', label: 'Delivered' },
    'cancelled': { variant: 'destructive', label: 'Cancelled' },
    'refunded': { variant: 'success', label: 'Refunded' },
    'partially_refunded': { variant: 'outline', label: 'Partially Refunded' },
  };

  return statusConfig[status] || { variant: 'outline', label: status };
};

export const calculateSelectedRefundAmount = (
  selectedItems: Record<string, { quantity: number; reason: string; customReason: string }>,
  order: Order
) => {
  let total = 0;
  for (const [itemId, itemData] of Object.entries(selectedItems)) {
    const item = order.items.find((i) => i._id.toString() === itemId);
    if (item && itemData.quantity > 0) {
      // Calculate proportional amount (price + tax + shipping)
      const itemTotal = item.price * itemData.quantity;
      const proportion = (item.price * itemData.quantity) / order.subtotal;
      const itemTax = order.taxAmount * proportion;
      const itemShipping = order.shippingCost * proportion;
      
      total += itemTotal + itemTax + itemShipping;
    }
  }
  return total;
};

export const isPartialRefundPossible = (order: Order) => {
  return order.items.some((item: OrderItem) => item.delivered);
};

export const canCancelOrder = (order: Order) => {
  return order && 
    order.status !== 'shipped' && 
    order.status !== 'delivered' && 
    order.status !== 'cancelled' && 
    order.status !== 'refunded';
};