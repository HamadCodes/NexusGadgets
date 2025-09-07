import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Order } from '@/models/Order';

interface OrderSummaryProps {
  order: Order;
}

export default function OrderSummary({ order }: OrderSummaryProps) {
  const maxRefundable = (order.total / 100) - (order.refundedAmount || 0);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${order.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>${order.shippingCost.toFixed(2)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between">
            <span>Discount</span>
            <span className="text-green-600">-${order.discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Tax ({order.taxRate * 100}%)</span>
          <span>${order.taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold pt-2 border-t">
          <span>Total</span>
          <span>${(order.total / 100).toFixed(2)}</span>
        </div>
        {order.refundedAmount > 0 && (
          <div className="flex justify-between text-red-600 pt-2">
            <span>Refunded</span>
            <span>-${order.refundedAmount.toFixed(2)}</span>
          </div>
        )}
        {maxRefundable > 0 && (
          <div className="flex justify-between pt-2">
            <span>Available for Refund</span>
            <span>${maxRefundable.toFixed(2)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}