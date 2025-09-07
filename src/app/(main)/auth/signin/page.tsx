'use client';
import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SignInPage() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Handle redirect when session exists
  useEffect(() => {
    if (session) {
      window.location.href = '/';
    }
  }, [session]);

  // Show loading state while session is being checked
  if (status === 'loading') {
    return <div className="max-w-md mx-auto my-25 max-lg:mt-10 p-6 rounded-lg"><Skeleton className='max-w-md h-[410px] rounded-lg'/></div>;
  }

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = await signIn('credentials', { 
      email, 
      password, 
      redirect: false 
    });
    if (result?.error) setError(result.error);
    else window.location.href = '/';
  };

  return session ? (
    <div className="max-w-md mx-auto my-25 max-lg:mt-10 p-6 rounded-lg"><Skeleton className='max-w-md h-[410px] rounded-lg'/></div>
  ) : (
    <div className="max-w-md mx-auto my-25 max-lg:mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Sign In</h1>
      {error && <div className="mb-4 text-red-500">{error}</div>}
      <form onSubmit={handleCredentialsLogin} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          Sign In
        </button>
      </form>
      
      <div className="text-center">
        <p className="mb-4">Or continue with</p>
        <button
          onClick={() => signIn('google')}
          className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"/>
          </svg>
          Sign in with Google
        </button>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-sm">
          {"Don't have an account? "}
          <a href="/auth/signup" className="text-blue-600 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}