import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Asegurarse de que la API KEY existe
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'pega_tu_clave_api_aqui') {
  console.error('❌ Error: GEMINI_API_KEY no está configurada correctamente en el archivo .env');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testGemini() {
  try {
    console.log('⏳ Conectando con Gemini API...');
    
    // Usamos el modelo gemini-1.5-flash que es rápido y eficiente
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = 'Dime un chiste corto de programación en español.';
    console.log(`\nEnviando prompt: "${prompt}"\n`);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Respuesta de Gemini recibida con éxito:\n');
    console.log('--------------------------------------------------');
    console.log(text.trim());
    console.log('--------------------------------------------------\n');
    
  } catch (error) {
    console.error('❌ Hubo un error al comunicarse con la API de Gemini:');
    console.error(error.message);
  }
}

testGemini();
