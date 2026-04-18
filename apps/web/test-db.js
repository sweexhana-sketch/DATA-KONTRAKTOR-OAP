import { Pool } from '@neondatabase/serverless';
import sql from './src/app/api/utils/sql.js';

async function checkDb() {
    try {
        console.log('Checking database table auth_users...');
        const result = await sql`SELECT table_name FROM information_schema.tables WHERE table_name = 'auth_users'`;
        console.log('Result:', result);

        if (result.length === 0) {
            console.log('Creating auth_users table...');
            await sql`
                CREATE TABLE IF NOT EXISTS auth_users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    name TEXT,
                    password TEXT NOT NULL,
                    image TEXT,
                    role TEXT DEFAULT 'user',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            `;
            console.log('Table created.');
        } else {
            console.log('Table auth_users already exists.');
        }
    } catch (error) {
        console.error('Error querying DB:', error);
    }
}
checkDb();
