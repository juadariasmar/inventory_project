import { NextRequest, NextResponse } from 'next/server'
import { WebhooksService } from '../../../../services/WebhooksService'
import { AppError } from '../../../../lib/AppError'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    try {
      await WebhooksService.validarFirma(rawBody, req.headers)
    } catch (e) {
      console.error('[Webhooks] Firma inválida:', e)
      return NextResponse.json({ error: 'Firma de webhook inválida' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    console.log('[Webhook Payload Entry]:', JSON.stringify(payload, null, 2))

    // Neon Auth envía en la raíz: event_type (o type), event_data (o data), y user.email
    const eventType = payload.event_type || payload.type
    const eventData = payload.event_data || payload.data || payload.payload || {}
    const userEmail: string | undefined = payload.user?.email

    console.log(`[Webhook] eventType=${eventType} | userEmail=${userEmail}`)

    if (eventType === 'user.created' || (!eventType && payload.id)) {
      await WebhooksService.procesarEventoUsuarioCreado(payload)
    } else if (eventType === 'send.otp') {
      await WebhooksService.procesarEventoSendOtp(userEmail, eventData)
    } else if (eventType === 'send.magic_link') {
      await WebhooksService.procesarEventoSendMagicLink(userEmail, eventData)
    } else {
      console.log(`[Webhooks] Evento desconocido ignorado: ${eventType}`)
    }

    return NextResponse.json({ success: true, allowed: true }, { status: 200 })
  } catch (error) {
    console.error('[Webhooks] Error inesperado procesando webhook:', error)
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: 'Error interno procesando webhook' }, { status: 500 })
  }
}
