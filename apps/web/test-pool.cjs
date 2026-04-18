const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
require('dotenv').config();

neonConfig.webSocketConstructor = ws;

async function check() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        const email = 'login_test1741046835269@example.com'; // from dev-output.log

        console.log('Query 1: get user by email');
        const result = await pool.query('select * from auth_users where email = $1', [email]);
        console.log(result.rows[0]);

        if (result.rows[0]) {
            console.log('Query 2: get accounts');
            const accountsData = await pool.query(
                'select * from auth_accounts where "userId" = $1',
                [result.rows[0].id]
            );
            console.log(accountsData.rows);
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await pool.end();
    }
}
check();
