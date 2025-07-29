import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the request is for the admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const userAgent = request.headers.get('user-agent') || '';
    
    // Block access from common bots and crawlers
    const isBot = /bot|crawler|spider|crawling/i.test(userAgent);
    
    if (isBot) {
      // Return 404 for bots to hide the route existence
      return new NextResponse('Not Found', { status: 404 });
    }
    
    // Allow access to the admin route - authentication will be handled by the component
    // This allows the login page to be accessible while keeping the route hidden from bots
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};