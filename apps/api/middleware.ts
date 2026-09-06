import { NextRequest } from 'next/server';
import Cors from 'next-cors';

const cors = Cors({
  allowMethods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  allowCredentials: true,
});

export async function middleware(request: NextRequest) {
  return cors(request, async () => {
    return new Response('OK');
  });
}

export const config = {
  matcher: ['/api/:path*'],
};
