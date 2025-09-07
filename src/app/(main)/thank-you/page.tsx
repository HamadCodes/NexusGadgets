// src/app/(main)/thank-you/page.tsx
import { NextPage } from 'next';
import Link from 'next/link';

const ThankYouPage: NextPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[600px]">
      <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
      <p className="mb-6">Your order has been placed successfully.</p>
      <Link href="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Continue Shopping
      </Link>
    </div>
  );
};

export default ThankYouPage;