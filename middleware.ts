import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Security headers
  const response = NextResponse.next()

  // Prevent SQL injection attempts in query parameters
  const url = request.nextUrl
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|ALTER|CREATE|TRUNCATE)\b)/i,
    /('|"|;|--|\/\*|\*\/|@@|char|nchar|varchar|nvarchar)/i
  ]

  // Check URL path and search params for SQL injection patterns
  const pathname = url.pathname.toLowerCase()
  const searchParams = url.search.toLowerCase()

  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(pathname) || pattern.test(searchParams)) {
      return new NextResponse('طلب غير صالح', { status: 400 })
    }
  }

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // CSP Header (Content Security Policy)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';"
  )

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}