import sql from './src/app/api/utils/sql.js';
import { hash } from 'bcryptjs';

async function initDb() {
    try {
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
        console.log('Table auth_users ready.');

        const email = 'admin@example.com';
        const existing = await sql`SELECT id FROM auth_users WHERE email = ${email}`;

        if (existing.length === 0) {
            console.log('Creating test admin user...');
            const id = 'user_admin_' + Date.now();
            const hashedPassword = await hash('password123', 10);
            await sql`
                INSERT INTO auth_users (id, email, name, password, role)
                VALUES (${id}, ${email}, 'Admin Test', ${hashedPassword}, 'admin')
            `;
            console.log('Test admin user created: admin@example.com / password123');
        } else {
            console.log('Test admin user already exists.');
        }
    } catch (error) {
        console.error('Error initializing DB:', error);
    }
}

initDb();
