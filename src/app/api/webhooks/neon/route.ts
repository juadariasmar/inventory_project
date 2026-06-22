import { NextRequest, NextResponse } from 'next/server'
import { WebhooksService } from '../../../../services/WebhooksService'
import { AppError } from '../../../../lib/AppError'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    let token = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }

    try {
      await WebhooksService.validarFirma(token)
    } catch {
      return NextResponse.json({ error: 'Firma de webhook inválida' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let payload: any
    try {
      payload = await req.json()
    } catch {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    // Neon Auth events usually have a type and data
    const eventType = payload.type
    const eventData = payload.data || payload

    if (eventType === 'user.created' || (!eventType && eventData.id)) {
      await WebhooksService.procesarEventoUsuarioCreado(eventData)
    } else {
      console.log(`[Webhooks] Evento desconocido ignorado: ${eventType}`)
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[Webhooks] Error inesperado procesando webhook:', error)
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: 'Error interno procesando webhook' }, { status: 500 })
  }
}
