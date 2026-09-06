import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-auth-token',
      },
    });
  }

  // Pass through to route
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
