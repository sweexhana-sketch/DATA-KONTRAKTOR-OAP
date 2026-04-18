const { Pool } = require('@neondatabase/serverless');
require('dotenv').config();

async function checkDb() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        const result = await pool.query('SELECT email, name FROM users ORDER BY "createdAt" DESC LIMIT 3');
        console.log('Latest users:');
        result.rows.forEach(r => console.log(r));
    } catch (error) {
        console.error('Error querying DB:', error);
    } finally {
        await pool.end();
    }
}
checkDb();
