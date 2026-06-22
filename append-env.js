/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const crypto = require('crypto');

const content = `
# Neon Auth
NEON_AUTH_BASE_URL="https://ep-mute-grass-ai4pz43v.neonauth.c-4.us-east-1.aws.neon.tech/neondb/auth"
NEON_AUTH_COOKIE_SECRET="${crypto.randomBytes(32).toString('hex')}"
NEON_WEBHOOK_SECRET="whsec_${crypto.randomBytes(16).toString('hex')}"
`;

fs.appendFileSync('.env.local', content);
console.log('Variables de entorno añadidas correctamente a .env.local');
