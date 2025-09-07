"use client"

import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import useCart from '@/hooks/useCart';
import CheckoutForm from '@/components/CheckoutForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const CheckoutPage: NextPage = () => {
  const { status } = useSession();
  const { initialized: cartInitialized, cartCount } = useCart();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading' || !cartInitialized) return;

    if (status !== 'authenticated') {
      router.push('/api/auth/signin');
      return;
    }

    if (cartCount === 0) {
      setError('Your cart is empty');
      setLoading(false);
      return;
    }

    setLoading(false);
  }, [status, cartInitialized, cartCount, router]);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Head>
        <title>Checkout</title>
      </Head>
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <Elements 
        stripe={stripePromise}
        options={{
          appearance: {
            theme: 'stripe',
          },
        }}
      >
        <CheckoutForm />
      </Elements>
    </div>
  );
};

export default CheckoutPage;