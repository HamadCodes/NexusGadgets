import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

const adminRoutes = ['/admin'];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isAdminRoute = adminRoutes.some(route => path.startsWith(route));

  if (!isAdminRoute) return NextResponse.next();

  const token = await getToken({ req });
  
  if (!token) {
    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(signInUrl);
  }

  if (token.role !== 'admin') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};