'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw } from 'lucide-react';
import { canCancelOrder } from '@/lib/utils';
import { Order } from '@/models/Order';

interface OrderStatusUpdateProps {
  order: Order;
  onRefetchOrder: () => void;
}

export default function OrderStatusUpdate({ order, onRefetchOrder }: OrderStatusUpdateProps) {
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [refundMessage, setRefundMessage] = useState('');

  const updateOrderStatus = async (status: string) => {
    setStatusUpdateLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${order._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (res.ok) {
        onRefetchOrder();
      } else {
        const errorData = await res.json();
        setRefundMessage(errorData.error || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Failed to update order:', error);
      setRefundMessage('Failed to update order status');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Check if order has refunds but is not fully refunded
  const isPartiallyRefunded = order.refundedAmount > 0 && order.refundedAmount < order.total / 100;
  const isFullyRefunded = order.refundedAmount >= order.total / 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          value={order.status}
          onValueChange={(value) => updateOrderStatus(value)}
          disabled={statusUpdateLoading || isPartiallyRefunded || isFullyRefunded}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem 
              value="cancelled" 
              disabled={!canCancelOrder(order)}
            >
              Cancelled
            </SelectItem>
            {isPartiallyRefunded && (
              <SelectItem value="partially_refunded" disabled>
                Partially Refunded
              </SelectItem>
            )}
            {isFullyRefunded && (
              <SelectItem value="refunded" disabled>
                Refunded
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        
        {(isPartiallyRefunded || isFullyRefunded) && (
          <Alert variant="default" className="bg-amber-50 border-amber-200">
            <AlertDescription className="text-amber-800">
              {isPartiallyRefunded 
                ? "This order has been partially refunded. Status cannot be changed." 
                : "This order has been fully refunded. Status cannot be changed."}
            </AlertDescription>
          </Alert>
        )}
        
        {!canCancelOrder(order) && order.status !== 'cancelled' && !isPartiallyRefunded && !isFullyRefunded && (
          <Alert variant="default" className="bg-amber-50 border-amber-200">
            <AlertDescription className="text-amber-800">
              This order can no longer be cancelled as it has already been shipped.
            </AlertDescription>
          </Alert>
        )}
        
        {statusUpdateLoading && (
          <div className="flex items-center text-sm text-muted-foreground">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Updating status...
          </div>
        )}

        {refundMessage && (
          <Alert variant={refundMessage.includes('Failed') ? 'destructive' : 'default'}>
            <AlertDescription>{refundMessage}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}