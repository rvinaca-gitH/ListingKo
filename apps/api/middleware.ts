import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Get auth token from headers
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (token) {
    // Pass token through to API routes via custom header
    response.headers.set('x-auth-token', token);
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
