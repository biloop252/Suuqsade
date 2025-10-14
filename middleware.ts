import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Allow auth callback to pass through without any middleware interference
  if (req.nextUrl.pathname.startsWith('/auth/callback')) {
    return res
  }

  // Check if the route is an admin route
  if (req.nextUrl.pathname.startsWith('/admin')) {
    // Skip login page and debug page
    if (req.nextUrl.pathname === '/admin/login' || req.nextUrl.pathname === '/admin/debug') {
      return res
    }

    console.log('Admin route accessed:', req.nextUrl.pathname)

    // For now, allow all admin routes to pass through
    // The client-side components will handle the authentication
    console.log('Allowing admin route access')
    return res
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/callback (auth callback route)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback).*)',
  ],
}
