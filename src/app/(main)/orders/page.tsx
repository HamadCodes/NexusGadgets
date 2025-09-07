'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Order } from '@/models/Order';
import { OrderItem } from '@/models/Order';
import Image from 'next/image';

const OrderStatusBadge = ({ status }: { status: string }) => {
  const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive', label: string }> = {
    'delivered': { variant: 'default', label: 'Delivered' },
    'processing': { variant: 'secondary', label: 'Processing' },
    'shipped': { variant: 'outline', label: 'Shipped' },
    'cancelled': { variant: 'destructive', label: 'Cancelled' },
    'refunded': { variant: 'secondary', label: 'Refunded' },
    'partially_refunded': { variant: 'outline', label: 'Partially Refunded' },
  };

  const config = statusConfig[status] || { variant: 'outline', label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const OrderItemCard = ({ item }: { item: Order['items'][0] }) => {
  return (
    <div className="flex gap-4 py-4 border-b last:border-b-0 items-center mx-3">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden flex-shrink-0">
        <Image
          src={item.imageUrl}
          alt={item.name}
          width={80}
          height={80}
          className="w-full h-full object-contain"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm sm:text-base truncate">{item.name}</h4>
        <div className="flex flex-wrap gap-2 mt-1 text-xs sm:text-sm text-muted-foreground">
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
            <Badge variant="outline" className="text-xs">
              Refunded: {item.refundedQuantity}
            </Badge>
          )}
        </div>
        <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
          <span className="font-medium text-sm sm:text-base">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.price)}
          </span>
          {item.delivered && item.deliveredAt && (
            <Badge variant="outline" className="text-xs w-fit">
              Delivered on {new Date(item.deliveredAt).toLocaleDateString()}
            </Badge>
          )}
        </div>
        {item.refundReason && (
          <div className="mt-1 text-xs text-muted-foreground">
            Refund reason: {item.refundReason}
          </div>
        )}
      </div>
    </div>
  );
};

const OrderCard = ({ order, onOrderUpdate }: { order: Order; onOrderUpdate: (updatedOrder: Order) => void }) => {
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fix total calculation - divide by 100 to handle cents
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: order.currency || 'USD' 
    }).format(amount / 100);
  };

  const handleCancelOrder = async () => {
    setIsCancelling(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`/api/orders/${order._id}/cancel`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel order');
      }

      const updatedOrder = await response.json();
      onOrderUpdate(updatedOrder);
      
      // Show success message
      if (order.paymentStatus === 'succeeded') {
        setSuccess(`Order #${order.orderNumber} has been cancelled and your refund is being processed. It may take 5-10 business days to appear in your account.`);
      } else {
        setSuccess(`Order #${order.orderNumber} has been cancelled successfully`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to cancel order. Please try again.";
      setError(errorMessage);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
          <div className="min-w-0">
            <CardTitle className="text-lg truncate">Order #{order.orderNumber}</CardTitle>
            <CardDescription>
              Placed on {new Date(order.orderDate).toLocaleDateString()}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <OrderStatusBadge status={order.status} />
            {order.refundedAmount > 0 && (
              <Badge variant="outline" className="text-xs">
                Refunded: {formatCurrency(order.refundedAmount * 100)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <h4 className="font-medium mb-3">Items</h4>
            <div className="border rounded-lg divide-y">
              {order.items.map((item: OrderItem) => (
                <OrderItemCard key={item._id.toString()} item={item} />
              ))}
            </div>
          </div>
          
          <div className="w-full lg:w-80 xl:w-96 space-y-4">
            <div>
              <h4 className="font-medium mb-2">Shipping Address</h4>
              <div className="text-sm text-muted-foreground">
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postal_code}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Order Information</h4>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Shipping Method:</div>
                <div className="capitalize">{order.shippingMethod}</div>
                
                {order.trackingNumber && (
                  <>
                    <div className="text-muted-foreground">Tracking Number:</div>
                    <div className="break-all">{order.trackingNumber}</div>
                  </>
                )}
                
                <div className="text-muted-foreground">Payment Method:</div>
                <div className="capitalize">{order.paymentMethod.replace('_', ' ')}</div>
                
                <div className="text-muted-foreground">Payment Status:</div>
                <div className="capitalize">{order.paymentStatus}</div>
                
                {order.estimatedDelivery && (
                  <>
                    <div className="text-muted-foreground">Estimated Delivery:</div>
                    <div>{new Date(order.estimatedDelivery).toLocaleDateString()}</div>
                  </>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Order Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${order.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>${order.shippingCost}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span className="text-green-600">-${order.discount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax ({order.taxRate * 100}%)</span>
                  <span>${order.taxAmount.toFixed(2)}</span>
                </div>
                {order.refundedAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Refunded</span>
                    <span>-{formatCurrency(order.refundedAmount * 100)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(order.total - (order.refundedAmount * 100 || 0))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col xs:flex-row justify-end gap-2 mt-6">
          {order.status === 'processing' && (
            <Button 
              variant="destructive" 
              size="sm" 
              className="w-full xs:w-auto"
              onClick={handleCancelOrder}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Order'}
            </Button>
          )}
          {error && (
            <div className="text-sm text-destructive mt-2">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-green-600 mt-2">
              {success}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const OrderSkeleton = () => {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
          <div>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <Skeleton className="h-5 w-20 mb-3" />
            <div className="border rounded-lg divide-y">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-4 py-4 mx-3">
                  <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-md flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="w-full lg:w-80 xl:w-96 space-y-4">
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
            
            <div>
              <Skeleton className="h-5 w-40 mb-2" />
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col xs:flex-row justify-end gap-2 mt-6">
          <Skeleton className="h-10 w-full xs:w-32" />
          <Skeleton className="h-10 w-full xs:w-28" />
        </div>
      </CardContent>
    </Card>
  );
};

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/orders');
        
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        
        const data = await response.json();
        setOrders(data.orders);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, []);
  
  const handleOrderUpdate = (updatedOrder: Order) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order._id === updatedOrder._id ? updatedOrder : order
      )
    );
  };

  // Filter orders based on active tab
  const filteredOrders = activeTab === 'all' 
    ? orders 
    : orders.filter(order => order.status === activeTab);
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Orders</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Your Orders</h1>
        <p className="text-muted-foreground text-sm sm:text-base">View your order history and track shipments</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="flex flex-wrap h-auto gap-2">
          <TabsTrigger value="all" className="text-xs sm:text-sm">All Orders</TabsTrigger>
          <TabsTrigger value="processing" className="text-xs sm:text-sm">Processing</TabsTrigger>
          <TabsTrigger value="shipped" className="text-xs sm:text-sm">Shipped</TabsTrigger>
          <TabsTrigger value="delivered" className="text-xs sm:text-sm">Delivered</TabsTrigger>
          <TabsTrigger value="cancelled" className="text-xs sm:text-sm">Cancelled</TabsTrigger>
          <TabsTrigger value="refunded" className="text-xs sm:text-sm">Refunded</TabsTrigger>
          <TabsTrigger value="partially_refunded" className="text-xs sm:text-sm">Partially Refunded</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {loading ? (
        <div>
          {[1, 2].map((i) => (
            <OrderSkeleton key={i} />
          ))}
        </div>
      ) : filteredOrders.length > 0 ? (
        <div>
          {filteredOrders.map((order) => (
            <OrderCard 
              key={order._id?.toString()} 
              order={order} 
              onOrderUpdate={handleOrderUpdate}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-muted-foreground mb-4 text-center">
              {activeTab === 'all' 
                ? "You haven't placed any orders yet" 
                : `No ${activeTab.replace('_', ' ')} orders found`}
            </div>
            <Button>Continue Shopping</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}