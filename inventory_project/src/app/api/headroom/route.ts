import { NextResponse } from 'next/server';
import { withHeadroom } from 'headroom-ai/gemini';
import { GoogleGenAI } from '@google/genai';

// Asegúrate de definir GEMINI_API_KEY en tu archivo .env o .env.local
const ai = new GoogleGenAI({});
const wrappedModels = withHeadroom(ai.models as any, {
  model: 'gemini-2.5-pro',
  baseUrl: 'http://localhost:8787', // Apunta al proxy local en Python
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userMessage = body.message || '¿Qué salió mal?';

    // Salida simulada de un gran archivo de logs o base de datos
    const hugeLogOutput = Array.from({ length: 500 }, (_, i) => `[ERROR] Connection timeout on service api instance ${i}`).join('\n');

    // 1. Preparamos los mensajes utilizando el formato esperado por el SDK de Google
    const contents = [
      { role: 'user', parts: [{ text: userMessage }] },
      {
        role: 'model',
        parts: [{
          functionCall: { name: 'get_logs', args: { service: 'api' } }
        }],
      },
      {
        role: 'user',
        parts: [{
          functionResponse: {
            name: 'get_logs',
            // Este gran volumen de datos será comprimido automáticamente por Headroom
            response: { result: hugeLogOutput } 
          }
        }],
      },
    ];

    // 2. El cliente envuelto por withHeadroom comprime automáticamente los mensajes antes de enviar
    const response = await wrappedModels.generateContent({
      model: 'gemini-2.5-pro',
      contents: contents,
      config: {
        tools: [
          {
            functionDeclarations: [
              {
                name: 'get_logs',
                description: 'Obtener logs del sistema',
                parameters: {
                  type: 'OBJECT',
                  properties: { service: { type: 'STRING' } },
                },
              }
            ]
          }
        ],
        // Aquí puedes aplicar los Perfiles de Herramientas (Tool Profiles) de los que leíste en la documentación
        // para saltar la compresión o cambiar la agresividad en una herramienta específica
        headroom_tool_profiles: {
          "important_tool": { skip_compression: true },
          "get_logs": { skip_compression: false }
        }
      } as any // Forzamos el tipado para permitir la propiedad custom 'headroom_tool_profiles'
    });

    return NextResponse.json({
      answer: response.text,
      note: '¡Los mensajes fueron comprimidos usando el wrapper de Headroom para el SDK de Google!'
    });
  } catch (error: any) {
    console.error('Error en la ruta /api/headroom:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
