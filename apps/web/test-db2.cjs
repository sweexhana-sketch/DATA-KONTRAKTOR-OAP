const { Pool } = require('@neondatabase/serverless');
require('dotenv').config();

async function checkDb() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        const result = await pool.query('SELECT * FROM auth_accounts ORDER BY id DESC LIMIT 1');
        console.log('Latest account:', result.rows[0]);
    } catch (error) {
        console.error('Error querying DB:', error);
    } finally {
        await pool.end();
    }
}
checkDb();
