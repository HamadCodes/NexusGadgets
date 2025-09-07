'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import OrderHeader from '@/components/admin/OrderHeader';
import OrderOverview from '@/components/admin/OrderOverview';
import RefundTab from '@/components/admin/RefundTab';
import HistoryTab from '@/components/admin/HistoryTab';
import ActionsTab from '@/components/admin/ActionsTab';
import { Order } from '@/models/Order';

export default function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [order, setOrder] = useState<Order>();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (!res.ok) throw new Error('Failed to fetch order');
      
      const data = await res.json();
      setOrder(data.order);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      if ((session?.user)?.role === 'admin') {
        setIsAdmin(true);
        fetchOrder();
      } else {
        router.push('/');
      }
    }
  }, [status, session, router, orderId, fetchOrder]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!isAdmin) return <div className="p-8">Unauthorized</div>;
  if (!order) return <div className="p-8">Order not found</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <OrderHeader 
        order={order} 
        router={router} 
        onTabChange={setActiveTab} 
        activeTab={activeTab}
      />
      
      {activeTab === 'overview' && <OrderOverview order={order} onRefetchOrder={fetchOrder} />}
      {activeTab === 'refund' && <RefundTab order={order} onRefetchOrder={fetchOrder} />}
      {activeTab === 'history' && <HistoryTab order={order} />}
      {activeTab === 'actions' && <ActionsTab />}
    </div>
  );
}