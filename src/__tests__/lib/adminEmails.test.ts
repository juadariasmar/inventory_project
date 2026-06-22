import { esEmailAdministrador } from '../../lib/adminEmails'

describe('esEmailAdministrador', () => {
  const original = process.env.ADMIN_EMAILS
  afterEach(() => {
    if (original === undefined) delete process.env.ADMIN_EMAILS
    else process.env.ADMIN_EMAILS = original
  })

  it('devuelve false si ADMIN_EMAILS no está definido', () => {
    delete process.env.ADMIN_EMAILS
    expect(esEmailAdministrador('a@b.com')).toBe(false)
  })

  it('devuelve false para email vacío o nulo', () => {
    process.env.ADMIN_EMAILS = 'a@b.com'
    expect(esEmailAdministrador('')).toBe(false)
    expect(esEmailAdministrador(null)).toBe(false)
    expect(esEmailAdministrador(undefined)).toBe(false)
  })

  it('reconoce el correo ignorando mayúsculas y espacios', () => {
    process.env.ADMIN_EMAILS = '  Jefe@Empresa.com , otro@x.com '
    expect(esEmailAdministrador('jefe@empresa.com')).toBe(true)
    expect(esEmailAdministrador('OTRO@X.COM')).toBe(true)
    expect(esEmailAdministrador('nadie@x.com')).toBe(false)
  })
})
