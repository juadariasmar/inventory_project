// eslint-disable-next-line @typescript-eslint/no-require-imports
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    const result = await sql`SELECT 1 as num`;
    console.log('Connection verified:', result[0].num === 1);
  } catch (error) {
    console.error('Connection failed:', error);
    process.exit(1);
  }
}

main();
