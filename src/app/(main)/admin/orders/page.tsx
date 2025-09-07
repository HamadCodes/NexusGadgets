'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Order, OrderItem } from '@/models/Order';

export default function AdminOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      if ((session?.user)?.role === 'admin') {
        setIsAdmin(true);
        fetchOrders();
      } else {
        router.push('/');
      }
    }
  }, [status, session, router]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      setOrders(data.orders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    setStatusUpdateLoading(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (res.ok) {
        fetchOrders();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Failed to update order:', error);
      alert('Failed to update order status');
    } finally {
      setStatusUpdateLoading(null);
    }
  };

  const updateItemDelivery = async (orderId: string, itemId: string, delivered: boolean) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: delivered ? 'delivered' : 'processing',
          itemId 
        })
      });
      
      if (res.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Failed to update item delivery status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive', label: string }> = {
      'processing': { variant: 'secondary', label: 'Processing' },
      'shipped': { variant: 'outline', label: 'Shipped' },
      'delivered': { variant: 'default', label: 'Delivered' },
      'cancelled': { variant: 'destructive', label: 'Cancelled' },
      'refunded': { variant: 'default', label: 'Refunded' },
      'partially_refunded': { variant: 'outline', label: 'Partially Refunded' },
    };

    const config = statusConfig[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const canCancelOrder = (order: Order) => {
    return order.status !== 'shipped' && 
           order.status !== 'delivered' && 
           order.status !== 'cancelled' && 
           order.status !== 'refunded' &&
           order.status !== 'partially_refunded';
  };

  // Check if order has refunds but is not fully refunded
  const isPartiallyRefunded = (order: Order) => {
    return order.refundedAmount > 0 && order.refundedAmount < order.total / 100;
  };

  // Check if order is fully refunded
  const isFullyRefunded = (order: Order) => {
    return order.refundedAmount >= order.total / 100;
  };

  // Apply all filters
  const filteredOrders = orders.filter(order => {
    // Search filter
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer.email && order.customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.customer.name && order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    // Payment status filter
    const matchesPaymentStatus = paymentStatusFilter === 'all' || order.paymentStatus === paymentStatusFilter;
    
    // Date range filter
    const orderDate = new Date(order.orderDate);
    const matchesDateRange = 
      (!dateRange.from || orderDate >= dateRange.from) && 
      (!dateRange.to || orderDate <= new Date(dateRange.to.setHours(23, 59, 59, 999)));
    
    // Amount filter
    const orderAmount = order.total / 100;
    const matchesMinAmount = !minAmount || orderAmount >= parseFloat(minAmount);
    const matchesMaxAmount = !maxAmount || orderAmount <= parseFloat(maxAmount);
    
    return matchesSearch && matchesStatus && matchesPaymentStatus && matchesDateRange && matchesMinAmount && matchesMaxAmount;
  });

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentStatusFilter('all');
    setDateRange({ from: undefined, to: undefined });
    setMinAmount('');
    setMaxAmount('');
  };

  // Check if any filter is active
  const isFilterActive = 
    searchTerm !== '' || 
    statusFilter !== 'all' || 
    paymentStatusFilter !== 'all' || 
    dateRange.from !== undefined || 
    dateRange.to !== undefined || 
    minAmount !== '' || 
    maxAmount !== '';

  if (loading) return <div className="p-8">Loading...</div>;
  if (!isAdmin) return <div className="p-8">Unauthorized</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Order Management</CardTitle>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {isFilterActive && (
                <Badge variant="secondary" className="ml-1">
                  Active
                </Badge>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <Input
              placeholder="Search orders by number, email, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Order Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                      <SelectItem value="partially_refunded">Partially Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Status</label>
                  <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All payment statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payment Statuses</SelectItem>
                      <SelectItem value="succeeded">Succeeded</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRange.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} -{" "}
                              {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        autoFocus
                        mode="range"
                        defaultMonth={dateRange.from}
                        selected={dateRange}
                        onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount Range</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Min $"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                    />
                    <Input
                      placeholder="Max $"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                    />
                  </div>
                </div>
                
                {isFilterActive && (
                  <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                    <Button variant="ghost" onClick={clearFilters} className="flex items-center gap-1">
                      <X className="h-4 w-4" />
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Orders Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => {
                    const partiallyRefunded = isPartiallyRefunded(order);
                    const fullyRefunded = isFullyRefunded(order);
                    const isRefunded = partiallyRefunded || fullyRefunded;
                    
                    return (
                      <TableRow key={order._id.toString()}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>
                          {order.customer.name}<br/>
                          <span className="text-sm text-muted-foreground">{order.customer.email}</span>
                        </TableCell>
                        <TableCell>
                          {format(new Date(order.orderDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Popover>
                            <PopoverTrigger className="text-blue-600 hover:underline">
                              {order.items.length} items
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <div className="space-y-2">
                                {order.items.map((item: OrderItem, index: number) => (
                                  <div key={index} className="border-b pb-2 last:border-0">
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-sm">Qty: {item.quantity}</p>
                                    {item.refundedQuantity > 0 && (
                                      <p className="text-sm text-red-600">
                                        Refunded: {item.refundedQuantity}
                                      </p>
                                    )}
                                    {item.color && (
                                      <p className="text-sm">
                                        Color: <span className="inline-block w-3 h-3 rounded-full mr-1" style={{ backgroundColor: item.color.hexCode }}></span>
                                        {item.color.name}
                                      </p>
                                    )}
                                    {item.storage && (
                                      <p className="text-sm">Storage: {item.storage.storage}</p>
                                    )}
                                    <p className="text-sm">Price: ${(item.price / 100).toFixed(2)}</p>
                                    <div className="flex items-center mt-1">
                                      <input
                                        type="checkbox"
                                        id={`delivered-${item._id}`}
                                        checked={item.delivered || false}
                                        onChange={(e) => updateItemDelivery(order._id.toString(), item._id.toString(), e.target.checked)}
                                        className="h-4 w-4 mr-2"
                                        disabled={isRefunded}
                                      />
                                      <label htmlFor={`delivered-${item._id}`} className="text-sm">
                                        Delivered
                                      </label>
                                      {item.deliveredAt && (
                                        <span className="text-xs ml-2 text-muted-foreground">
                                          on {format(new Date(item.deliveredAt), 'MMM dd, yyyy')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell>
                          ${(order.total / 100).toFixed(2)}
                          {order.refundedAmount > 0 && (
                            <div className="text-xs text-red-600">
                              Refunded: ${order.refundedAmount.toFixed(2)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status)}
                          {statusUpdateLoading === order._id.toString() && (
                            <span className="ml-2 text-xs text-muted-foreground">Updating...</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={order.paymentStatus === 'succeeded' ? 'default' : 'outline'}>
                            {order.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <Select
                              value={order.status}
                              onValueChange={(value) => updateOrderStatus(order._id.toString(), value)}
                              disabled={statusUpdateLoading === order._id.toString() || isRefunded}
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
                                {partiallyRefunded && (
                                  <SelectItem value="partially_refunded" disabled>
                                    Partially Refunded
                                  </SelectItem>
                                )}
                                {fullyRefunded && (
                                  <SelectItem value="refunded" disabled>
                                    Refunded
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <Button 
                              variant="outline"
                              onClick={() => router.push(`/admin/orders/${order._id}`)}
                              size="sm"
                            >
                              View Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Results count */}
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
        </CardContent>
      </Card>
    </div>
  );
}