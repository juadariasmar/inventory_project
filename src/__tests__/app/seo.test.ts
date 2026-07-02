import robots from '../../app/robots'
import sitemap from '../../app/sitemap'

describe('SEO config files', () => {
  it('robots returns correct allowed and disallowed routes', () => {
    const res = robots()
    expect(res.rules).toBeDefined()
    // @ts-ignore
    const rules = Array.isArray(res.rules) ? res.rules[0] : res.rules
    expect(rules.userAgent).toBe('*')
    expect(rules.allow).toContain('/')
    expect(rules.allow).toContain('/auth/sign-in')
    expect(rules.disallow).toContain('/api/')
    expect(rules.disallow).toContain('/admin/')
    expect(res.sitemap).toBe('https://inventory-project-ten.vercel.app/sitemap.xml')
  })

  it('sitemap returns correct public routes array', () => {
    const res = sitemap()
    expect(res.length).toBe(5)
    expect(res[0].url).toBe('https://inventory-project-ten.vercel.app/')
    expect(res[1].url).toBe('https://inventory-project-ten.vercel.app/auth/sign-in')
  })
})
