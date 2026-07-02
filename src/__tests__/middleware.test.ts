import { middleware as proxy } from '../../src/middleware';
import { createMockRequest } from './utils/test-utils';

jest.mock('../../src/lib/auth/server', () => ({
  auth: {
    getSession: jest.fn().mockResolvedValue(null),
    middleware: jest.fn(() => () => null)
  }
}));

describe('Proxy Security Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('allows normal routes without rate limiting', async () => {
    const req = createMockRequest('http://localhost/api/productos', 'GET');
    const res = await proxy(req);
    // NextResponse returned by middleware might be empty if it calls NextResponse.next(), 
    // which shouldn't have status 429.
    if (res) {
      expect(res.status).not.toBe(429);
    }
  });

  it('rate limits login after 5 requests', async () => {
    const ip = '192.168.1.100';
    
    // 5 allowed requests
    for (let i = 0; i < 5; i++) {
      const req = createMockRequest('http://localhost/api/auth/callback/credentials', 'POST', ip);
      const res = await proxy(req);
      if (res) expect(res.status).not.toBe(429);
    }

    // 6th request should fail
    const req6 = createMockRequest('http://localhost/api/auth/callback/credentials', 'POST', ip);
    const res6 = await proxy(req6);
    
    // Check it fails
    expect(res6).toBeDefined();
    expect(res6!.status).toBe(429);
    
    // NextRequest json method
    const body = await res6!.json();
    expect(body.error).toContain('Demasiados intentos');

    // Wait 60 seconds
    jest.advanceTimersByTime(60000);

    // 7th request should pass again
    const req7 = createMockRequest('http://localhost/api/auth/callback/credentials', 'POST', ip);
    const res7 = await proxy(req7);
    if (res7) expect(res7.status).not.toBe(429);
  });

  it('no aplica rate limiting a rutas GET de auth (reset-password, email-otp)', async () => {
    const paths = [
      'http://localhost/auth/reset-password',
      'http://localhost/auth/email-otp',
      'http://localhost/auth/forgot-password',
      'http://localhost/auth/sign-up',
    ];

    for (const url of paths) {
      const req = createMockRequest(url, 'GET');
      const res = await proxy(req);
      if (res) {
        expect(res.status).not.toBe(429);
      }
    }
  });

  it('permite el acceso público a /sitemap.xml y /robots.txt sin pasar por auth.middleware', async () => {
    const urls = [
      'http://localhost/sitemap.xml',
      'http://localhost/robots.txt'
    ];

    for (const url of urls) {
      const req = createMockRequest(url, 'GET');
      const res = await proxy(req);
      // Puesto que el mock de auth.middleware devuelve null, si res no es null es porque retornó NextResponse.next()
      expect(res).not.toBeNull();
    }
  });
});
