import { createMockRequest } from './test-utils';

describe('test-utils', () => {
  describe('createMockRequest', () => {
    it('should create a GET request by default', () => {
      const req = createMockRequest('/api/test');
      expect(req.method).toBe('GET');
      expect(req.url).toBe('http://localhost/api/test');
      expect(req.headers.get('x-forwarded-for')).toBe('127.0.0.1');
    });

    it('should create a POST request with body', async () => {
      const body = { name: 'test' };
      const req = createMockRequest('/api/test', 'POST', '192.168.1.1', body);
      expect(req.method).toBe('POST');
      expect(req.url).toBe('http://localhost/api/test');
      expect(req.headers.get('x-forwarded-for')).toBe('192.168.1.1');
      const parsedBody = await req.json();
      expect(parsedBody).toEqual(body);
    });

    it('should correctly handle custom ip address', () => {
      const req = createMockRequest('/api/test', 'GET', '10.0.0.1');
      expect(req.headers.get('x-forwarded-for')).toBe('10.0.0.1');
    });
  });
});
