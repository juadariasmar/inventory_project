import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

// Mockeamos el módulo @google/generative-ai antes de importar nuestro script
mock.module('@google/generative-ai', {
  namedExports: {
    GoogleGenerativeAI: class {
      constructor(apiKey) {
        this.apiKey = apiKey;
      }
      getGenerativeModel({ model }) {
        return {
          generateContent: async (prompt) => {
            return {
              response: {
                text: () => 'Chiste mockeado'
              }
            };
          }
        };
      }
    }
  }
});

const { testGemini } = await import('./test_gemini.mjs');

describe('testGemini', () => {
  it('debería ejecutarse sin errores cuando la API key está definida', async () => {
    // Establecemos variable de entorno para el test
    process.env.GEMINI_API_KEY = 'fake-key-for-test';
    const result = await testGemini();
    assert.equal(result, 'Chiste mockeado');
  });

  it('debería lanzar error si no hay API key', async () => {
    delete process.env.GEMINI_API_KEY;
    await assert.rejects(
      () => testGemini(),
      { message: 'La variable de entorno GEMINI_API_KEY no está definida.' }
    );
  });
});
