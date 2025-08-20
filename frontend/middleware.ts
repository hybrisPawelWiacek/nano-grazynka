import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isTokenValid } from './lib/auth-helpers';

// Define protected routes
const protectedRoutes = [
  // Homepage now accessible to anonymous users
  '/dashboard',
  '/settings',
  '/billing',
];

// Define auth routes (should redirect to home if already logged in)
const authRoutes = [
  '/login',
  '/register',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const tokenCookie = request.cookies.get('token');
  
  // Check if token exists AND is valid
  let hasValidToken = false;
  if (tokenCookie?.value) {
    hasValidToken = isTokenValid(tokenCookie.value);
    
    // If token exists but is invalid, we should NOT block auth routes
    if (!hasValidToken) {
      console.log('Invalid token detected in middleware, allowing auth route access');
    }
  }

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if the route is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Redirect to login if accessing protected route without valid token
  if (isProtectedRoute && !hasValidToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Only redirect away from auth routes if token is VALID
  // Invalid tokens should NOT prevent access to login/register
  if (isAuthRoute && hasValidToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};