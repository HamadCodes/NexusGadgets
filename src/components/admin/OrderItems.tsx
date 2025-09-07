import { Badge } from '@/components/ui/badge';
import { formatDateSafely } from '@/lib/utils';
import { OrderItem } from '@/models/Order';
import Image from 'next/image';

interface OrderItemsProps {
  items: OrderItem[];
}

export default function OrderItems({ items }: OrderItemsProps) {
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Order Items</h3>
      <div className="border rounded-lg divide-y">
        {items.map((item: OrderItem) => (
          <div key={item._id.toString()} className="p-4 flex items-start gap-4">
            <Image
              src={item.imageUrl}
              alt={item.name}
              width={80}
              height={80}
              className="w-20 h-20 object-contain m-auto"
            />
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <div className="flex flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
                {item.color && (
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-3 h-3 rounded-full border" 
                      style={{ backgroundColor: item.color.hexCode }}
                    />
                    <span>{item.color.name}</span>
                  </div>
                )}
                {item.storage && (
                  <div>{item.storage.storage}</div>
                )}
                <div>Qty: {item.quantity}</div>
                {item.refundedQuantity > 0 && (
                  <div className="text-red-600">Refunded: {item.refundedQuantity}</div>
                )}
                {item.delivered && (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Delivered
                  </Badge>
                )}
              </div>
              <div className="mt-2 flex items-center">
                <span className="font-medium">
                  ${item.price.toFixed(2)}
                </span>
                {item.delivered && item.deliveredAt && (
                  <Badge variant="outline" className="ml-3">
                    Delivered on {formatDateSafely(item.deliveredAt, 'PPP')}
                  </Badge>
                )}
              </div>
              {item.refundReason && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Refund reason: {item.refundReason}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}