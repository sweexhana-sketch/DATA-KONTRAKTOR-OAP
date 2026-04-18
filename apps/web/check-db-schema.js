import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function check() {
    try {
        const result = await sql`SELECT table_name FROM information_schema.tables WHERE table_name = 'auth_users'`;
        console.log('Tables found:', result);
        if (result.length === 0) {
            console.log('Table auth_users does not exist. Creating it...');
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
            console.log('Table created successfully.');
        }
    } catch (e) {
        console.error('Error:', e);
    }
}
check();
