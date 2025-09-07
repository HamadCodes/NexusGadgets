'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, DollarSign } from 'lucide-react';
import { calculateSelectedRefundAmount, isPartialRefundPossible } from '@/lib/utils';
import { Order, OrderItem, } from '@/models/Order';

interface RefundData {
  reason: string;
  amount?: number;
  items?: Array<{
    itemId: string;
    quantity: number;
    reason: string;
  }>;
}

interface RefundTabProps {
  order: Order;
  onRefetchOrder: () => void;
}

export default function RefundTab({ order, onRefetchOrder }: RefundTabProps) {
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundMessage, setRefundMessage] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [selectedItems, setSelectedItems] = useState<{[key: string]: {quantity: number, reason: string, customReason: string}}>({});

  // Initialize selectedItems when order changes
  useEffect(() => {
    const initialSelected: {[key: string]: {quantity: number, reason: string, customReason: string}} = {};
    order.items.forEach((item: OrderItem) => {
      initialSelected[item._id.toString()] = {
        quantity: 0,
        reason: '',
        customReason: ''
      };
    });
    setSelectedItems(initialSelected);
  }, [order]);

  // Refetch order when refund is processed
  useEffect(() => {
    if (!refundLoading && refundMessage.includes('success')) {
      onRefetchOrder();
    }
  }, [refundLoading, refundMessage, onRefetchOrder]);

  const maxRefundable = (order.total / 100) - (order.refundedAmount || 0);
  const selectedRefundAmount = calculateSelectedRefundAmount(selectedItems, order);

  const processRefund = async (type: 'full' | 'partial') => {
    setRefundLoading(true);
    setRefundMessage('');

    try {
      const finalReason = refundReason === 'Other' ? customReason : refundReason;
      
      const refundData:RefundData  = { reason: finalReason || 'Admin initiated refund' };
      
      if (type === 'full') {
        refundData.amount = maxRefundable;
      } else {
        // Prepare items for partial refund with their individual reasons
        const refundItems = [];
        for (const [itemId, itemData] of Object.entries(selectedItems)) {
          if (itemData.quantity > 0) {
            const itemReason = itemData.reason === 'Other' ? itemData.customReason : itemData.reason;
            refundItems.push({ 
              itemId, 
              quantity: itemData.quantity,
              reason: itemReason || finalReason || 'Partial refund'
            });
          }
        }
        
        if (refundItems.length === 0) {
          setRefundMessage('Please select at least one item to refund');
          setRefundLoading(false);
          return;
        }
        
        refundData.items = refundItems;
      }

      const res = await fetch(`/api/admin/orders/${order._id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(refundData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setRefundMessage('Refund processed successfully');
        // Reset form
        setRefundReason('');
        setCustomReason('');
        if (type === 'partial') {
          const resetSelected: {[key: string]: {quantity: number, reason: string, customReason: string}} = {};
          Object.keys(selectedItems).forEach(key => {
            resetSelected[key] = {quantity: 0, reason: '', customReason: ''};
          });
          setSelectedItems(resetSelected);
        }
      } else {
        setRefundMessage(data.error || 'Failed to process refund');
      }
    } catch (error) {
      console.error('Failed to process refund:', error);
      setRefundMessage('An error occurred while processing the refund');
    } finally {
      setRefundLoading(false);
    }
  };

  const handleItemQuantityChange = (itemId: string, quantity: number) => {
    const item = order.items.find((i: OrderItem) => i._id.toString() === itemId);
    if (!item) return;
    
    // Ensure quantity doesn't exceed available amount
    const maxQuantity = item.quantity - (item.refundedQuantity || 0);
    const newQuantity = Math.max(0, Math.min(quantity, maxQuantity));
    
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantity: newQuantity
      }
    }));
  };

  const handleItemReasonChange = (itemId: string, reason: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        reason,
        customReason: reason === 'Other' ? prev[itemId]?.customReason || '' : ''
      }
    }));
  };

  const handleItemCustomReasonChange = (itemId: string, customReason: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        customReason
      }
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Process Refund</CardTitle>
        <CardDescription>
          Refund all or part of this order
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {order.paymentStatus !== 'succeeded' && (
          <Alert variant="destructive">
            <AlertDescription>
              This order cannot be refunded because payment was not successful.
            </AlertDescription>
          </Alert>
        )}
        
        {maxRefundable <= 0 && (
          <Alert>
            <AlertDescription>
              This order has already been fully refunded.
            </AlertDescription>
          </Alert>
        )}
        
        {order.paymentStatus === 'succeeded' && maxRefundable > 0 && (
          <>
            <div className="space-y-4">
              <h3 className="font-medium">Full Refund</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <Label>Refund Amount ({order.currency.toUpperCase()})</Label>
                  <div className="p-2 border rounded-md bg-muted">
                    <p className="font-medium">${maxRefundable.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      Maximum refundable amount
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refundReason">Reason</Label>
                  <Select
                    value={refundReason}
                    onValueChange={setRefundReason}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Customer request">Customer request</SelectItem>
                      <SelectItem value="Defective product">Defective product</SelectItem>
                      <SelectItem value="Wrong item received">Wrong item received</SelectItem>
                      <SelectItem value="Late delivery">Late delivery</SelectItem>
                      <SelectItem value="Admin error">Admin error</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {refundReason === 'Other' && (
                    <Input
                      id="customReason"
                      placeholder="Please specify the reason"
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                    />
                  )}
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={() => processRefund('full')}
                    disabled={refundLoading || maxRefundable <= 0}
                    className="w-full"
                  >
                    {refundLoading ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <DollarSign className="mr-2 h-4 w-4" />
                    )}
                    Process Full Refund
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t pt-6 mt-6">
              <h3 className="font-medium mb-4">Partial Refund by Items</h3>
              
              {!isPartialRefundPossible(order) && (
                <Alert className="mb-4">
                  <AlertDescription>
                    Partial refund is only available for delivered items. No items in this order have been marked as delivered.
                  </AlertDescription>
                </Alert>
              )}
              
              {isPartialRefundPossible(order) && (
                <>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Ordered</TableHead>
                          <TableHead>Refunded</TableHead>
                          <TableHead>Available</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Refund Qty</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Custom Reason</TableHead>
                          <TableHead>Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items.map((item: OrderItem) => {
                          const availableQty = item.quantity - (item.refundedQuantity || 0);
                          const refundQty = selectedItems[item._id.toString()]?.quantity || 0;
                          const itemReason = selectedItems[item._id.toString()]?.reason || '';
                          const itemCustomReason = selectedItems[item._id.toString()]?.customReason || '';
                          
                          // Use the same calculation as the backend
                          const itemTotal = item.price * refundQty;
                          const itemProportion = (item.price * refundQty) / order.subtotal;
                          const itemTax = order.taxAmount * itemProportion;
                          const itemShipping = order.shippingCost * itemProportion;
                          const itemAmount = itemTotal + itemTax + itemShipping;
                          
                          return (
                            <TableRow key={item._id.toString()}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>${item.price.toFixed(2)}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>{item.refundedQuantity || 0}</TableCell>
                              <TableCell>{availableQty}</TableCell>
                              <TableCell>
                                {item.delivered ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Delivered
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    Not Delivered
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  max={availableQty}
                                  value={refundQty}
                                  onChange={(e) => handleItemQuantityChange(item._id.toString(), parseInt(e.target.value) || 0)}
                                  disabled={availableQty <= 0 || !item.delivered}
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={itemReason}
                                  onValueChange={(value) => handleItemReasonChange(item._id.toString(), value)}
                                  disabled={availableQty <= 0 || !item.delivered || refundQty === 0}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Reason" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Defective item">Defective item</SelectItem>
                                    <SelectItem value="Wrong item received">Wrong item received</SelectItem>
                                    <SelectItem value="Item not as described">Item not as described</SelectItem>
                                    <SelectItem value="Partial return">Partial return</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                {itemReason === 'Other' && (
                                  <Input
                                    placeholder="Specify reason"
                                    value={itemCustomReason}
                                    onChange={(e) => handleItemCustomReasonChange(item._id.toString(), e.target.value)}
                                    disabled={availableQty <= 0 || !item.delivered || refundQty === 0}
                                    className="w-40"
                                  />
                                )}
                              </TableCell>
                              <TableCell>${itemAmount.toFixed(2)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <div>
                      <p className="font-medium">Selected Refund Amount: ${selectedRefundAmount.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        After this refund, ${(maxRefundable - selectedRefundAmount).toFixed(2)} will remain refundable
                      </p>
                    </div>
                    <Button 
                      onClick={() => processRefund('partial')}
                      disabled={refundLoading || selectedRefundAmount <= 0}
                    >
                      {refundLoading ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <DollarSign className="mr-2 h-4 w-4" />
                      )}
                      Process Partial Refund
                    </Button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
        
        {refundMessage && (
          <Alert className={refundMessage.includes('success') ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
            <AlertDescription className={refundMessage.includes('success') ? 'text-green-800' : 'text-red-800'}>
              {refundMessage}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}