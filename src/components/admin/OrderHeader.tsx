import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { cn, getStatusConfig } from '@/lib/utils';
import { Order } from '@/models/Order';

interface OrderHeaderProps {
  order: Order;
  router:  {
    push: (url: string) => void;
  };
  onTabChange: (tab: string) => void;
  activeTab: string;
}

export default function OrderHeader({ order, router, onTabChange, activeTab }: OrderHeaderProps) {
  const statusConfig = getStatusConfig(order.status);
  
  // Map 'success' variant to 'default' and use custom class for styling
  const badgeVariant = statusConfig.variant === 'success' ? 'default' : statusConfig.variant;
  const badgeClass = statusConfig.variant === 'success' ? 'bg-green-100 text-green-800 hover:bg-green-200' : '';
  
  return (
    <div className="flex items-center gap-4">
      <Button variant="outline" onClick={() => router.push('/admin/orders')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Orders
      </Button>
      <h1 className="text-3xl font-bold">Order #{order.orderNumber}</h1>
      <Badge variant={badgeVariant} className={cn(badgeClass)}>
        {statusConfig.label}
      </Badge>
      
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="refund">Refunds</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}