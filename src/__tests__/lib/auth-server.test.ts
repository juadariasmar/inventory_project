jest.mock('@neondatabase/auth/next/server', () => ({
  createNeonAuth: jest.fn(() => ({ __mock: true })),
}))

import { resolveAuthSecrets } from '../../lib/auth/server'

describe('resolveAuthSecrets', () => {
  it('lanza en producción si faltan los secretos', () => {
    expect(() =>
      resolveAuthSecrets({ NODE_ENV: 'production' } as NodeJS.ProcessEnv)
    ).toThrow()
  })

  it('no lanza en producción si los secretos están presentes', () => {
    expect(() =>
      resolveAuthSecrets({
        NODE_ENV: 'production',
        NEON_AUTH_BASE_URL: 'https://example.neon.tech',
        NEON_AUTH_COOKIE_SECRET: 'un-secreto-real',
      } as NodeJS.ProcessEnv)
    ).not.toThrow()
  })

  it('usa fallbacks fuera de producción', () => {
    const cfg = resolveAuthSecrets({ NODE_ENV: 'development' } as NodeJS.ProcessEnv)
    expect(cfg.baseUrl).toContain('placeholder')
    expect(cfg.cookieSecret).toContain('build-only')
  })
})
