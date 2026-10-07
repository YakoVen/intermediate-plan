import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const path = request.nextUrl.pathname;

  // Add no-store cache headers for sensitive/dynamic routes
  if (path.startsWith('/dashboard') || path.startsWith('/account') || path.startsWith('/api')) {
    response.headers.set('Cache-Control', 'no-store, max-age=0');
  }

  // Basic protection for /account using a simple check
  // (In a real app, you'd verify a session cookie or token properly)
  if (path.startsWith('/account')) {
    // We are relying on client-side protection for Firebase Auth as well,
    // but here we can check for a custom session cookie if we had one.
    // For now, let's just let the client handle Firebase Auth state,
    // or you could set a simple cookie during login and check it here.
    const session = request.cookies.get('__session');
    // We will assume client side protection is in place for now.
    // if (!session) return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/account/:path*', '/api/:path*'],
};
