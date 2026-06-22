import { POST } from '../../app/api/webhooks/neon/route'
import { WebhooksService } from '../../services/WebhooksService'
import { NextRequest } from 'next/server'

jest.mock('../../services/WebhooksService')

describe('API Webhooks Neon', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEON_WEBHOOK_SECRET = 'secreto_test'
  })

  it('debe rechazar si no trae header de autorizacion', async () => {
    ;(WebhooksService.validarFirma as jest.Mock).mockRejectedValue(new Error('Firma de webhook inválida'))
    const req = new NextRequest('http://localhost/api/webhooks/neon', {
      method: 'POST'
    })
    const res = await POST(req)
    
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('Firma de webhook inválida')
  })

  it('debe rechazar si validarFirma lanza un AppError', async () => {
    (WebhooksService.validarFirma as jest.Mock).mockRejectedValue(new Error('Firma de webhook inválida'))
    
    const req = new NextRequest('http://localhost/api/webhooks/neon', {
      method: 'POST',
      headers: {
        'authorization': 'Bearer token_invalido'
      },
      body: JSON.stringify({})
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('debe devolver 400 si el payload es malformado (json parse error)', async () => {
    (WebhooksService.validarFirma as jest.Mock).mockResolvedValue(true)
    
    const req = new NextRequest('http://localhost/api/webhooks/neon', {
      method: 'POST',
      headers: {
        'authorization': 'Bearer secreto_test'
      },
      body: 'esto no es json'
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Payload inválido')
  })

  it('debe procesar exitosamente un evento type=user.created', async () => {
    ;(WebhooksService.validarFirma as jest.Mock).mockResolvedValue(true)
    ;(WebhooksService.procesarEventoUsuarioCreado as jest.Mock).mockResolvedValue(undefined)
    
    const req = new NextRequest('http://localhost/api/webhooks/neon', {
      method: 'POST',
      headers: {
        'authorization': 'Bearer secreto_test'
      },
      body: JSON.stringify({
        type: 'user.created',
        data: {
          id: 'neon-123',
          email: 'test@ejemplo.com'
        }
      })
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(WebhooksService.procesarEventoUsuarioCreado).toHaveBeenCalledWith({
      id: 'neon-123',
      email: 'test@ejemplo.com'
    })
  })

  it('debe retornar 200 pero no hacer nada si el evento es desconocido', async () => {
    (WebhooksService.validarFirma as jest.Mock).mockResolvedValue(true)
    
    const req = new NextRequest('http://localhost/api/webhooks/neon', {
      method: 'POST',
      headers: {
        'authorization': 'Bearer secreto_test'
      },
      body: JSON.stringify({
        type: 'otro.evento',
        data: {}
      })
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(WebhooksService.procesarEventoUsuarioCreado).not.toHaveBeenCalled()
  })
})
