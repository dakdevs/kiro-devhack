import { NextRequest, NextResponse } from 'next/server'
import { auth } from '~/lib/auth'
//meow
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the request is for the dashboard
  if (pathname.startsWith('/dashboard')) {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    // If no session, redirect to login
    if (!session) {
      const loginUrl = new URL('/', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}