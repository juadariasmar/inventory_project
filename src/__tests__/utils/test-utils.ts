import { NextRequest } from 'next/server';

export function createMockRequest(url: string, method: string = 'GET', ip: string = '127.0.0.1', body?: unknown) {
  const req = new NextRequest(new URL(url, 'http://localhost'), {
    method,
    body: body ? JSON.stringify(body) : undefined,
  });
  // Mock the IP headers for Rate Limiting testing
  req.headers.set('x-forwarded-for', ip);
  return req;
}
