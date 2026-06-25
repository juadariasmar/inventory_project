import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Obtiene la API key desde variable de entorno.
 * @returns {string} La API key.
 * @throws {Error} Si no está definida.
 */
function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('La variable de entorno GEMINI_API_KEY no está definida.');
  }
  return key;
}

/**
 * Prueba la conexión con Gemini API.
 * @returns {Promise<string>} El texto de respuesta.
 */
export async function testGemini() {
  const apiKey = getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);

  console.log('⏳ Conectando con Gemini API...');

  // Usamos modelo estable gemini-1.5-flash
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = 'Dime un chiste corto de programación en español.';
  console.log(`\nEnviando prompt: "${prompt}"\n`);

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log('✅ Respuesta de Gemini recibida con éxito:\n');
    console.log('--------------------------------------------------');
    console.log(text.trim());
    console.log('--------------------------------------------------\n');
    return text;
  } catch (error) {
    console.error('❌ Hubo un error al comunicarse con la API de Gemini:');
    console.error(error.message);
    throw error;
  }
}

// Ejecución directa si no es importado como módulo
if (process.argv[1] === import.meta.url) {
  testGemini().catch(() => process.exit(1));
}
