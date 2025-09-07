'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-md p-8 text-center">
        <div className="bg-gray-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg 
            className="w-20 h-20 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        
        <h1 className="text-6xl font-bold text-black mb-3">404</h1>
        <h2 className="text-2xl font-semibold text-black mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you are looking for does not exist or has been moved. Please check the URL and try again.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link href="/">
            <Button className="w-full sm:w-auto px-6 py-3">
              Return to Homepage
            </Button>
          </Link>
          <Link href="/contact-us">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Contact Support
            </Button>
          </Link>
        </div>
        
      </div>
    </div>
  );
}