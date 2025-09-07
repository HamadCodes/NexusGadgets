import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { formatDateSafely } from '@/lib/utils';
import OrderItems from './OrderItems';
import OrderStatusUpdate from './OrderStatusUpdate';
import OrderSummary from './OrderSummary';
import { Order } from '@/models/Order';

interface OrderOverviewProps {
  order: Order;
  onRefetchOrder: () => void;
}

export default function OrderOverview({ order, onRefetchOrder }: OrderOverviewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
          <CardDescription>
            Placed on {formatDateSafely(order.orderDate, 'PPpp')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-medium mb-2">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium">{order.customer.name}</p>
                <p className="text-sm text-muted-foreground">{order.customer.email}</p>
                <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
                {order.customer.vatNumber && (
                  <p className="text-sm text-muted-foreground">VAT: {order.customer.vatNumber}</p>
                )}
              </div>
              <div>
                <p className="font-medium">Guest Order: {order.customer.guest ? 'Yes' : 'No'}</p>
                <p className="text-sm text-muted-foreground">IP: {order.ipAddress}</p>
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div>
            <h3 className="text-lg font-medium mb-2">Shipping Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Shipping Address</p>
                <p className="text-sm">{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && (
                  <p className="text-sm">{order.shippingAddress.line2}</p>
                )}
                <p className="text-sm">
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postal_code}
                </p>
                <p className="text-sm">{order.shippingAddress.country}</p>
              </div>
              <div>
                <p className="font-medium">Shipping Method</p>
                <p className="text-sm capitalize">{order.shippingMethod}</p>
                {order.trackingNumber && (
                  <>
                    <p className="font-medium mt-2">Tracking Number</p>
                    <p className="text-sm">{order.trackingNumber}</p>
                  </>
                )}
                {order.estimatedDelivery && (
                  <>
                    <p className="font-medium mt-2">Estimated Delivery</p>
                    <p className="text-sm">{formatDateSafely(order.estimatedDelivery, 'PPP')}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div>
            <h3 className="text-lg font-medium mb-2">Payment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Payment Method</p>
                <p className="text-sm capitalize">{order.paymentMethod.replace('_', ' ')}</p>
                <p className="font-medium mt-2">Payment Status</p>
                <p className="text-sm capitalize">{order.paymentStatus}</p>
              </div>
              <div>
                {order.paymentIntentId && (
                  <>
                    <p className="font-medium">Payment Intent ID</p>
                    <p className="text-sm font-mono text-muted-foreground">{order.paymentIntentId}</p>
                  </>
                )}
                {order.transactionId && (
                  <>
                    <p className="font-medium mt-2">Transaction ID</p>
                    <p className="text-sm font-mono text-muted-foreground">{order.transactionId}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <OrderItems items={order.items} />
        </CardContent>
      </Card>

      {/* Order Actions & Summary */}
      <div className="space-y-6">
        <OrderStatusUpdate order={order} onRefetchOrder={onRefetchOrder} />
        <OrderSummary order={order} />
      </div>
    </div>
  );
}