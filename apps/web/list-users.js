import sql from './src/app/api/utils/sql.js';

async function listUsers() {
    try {
        const users = await sql`SELECT id, email, name, role FROM auth_users`;
        console.log('Users in database:', JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Error listing users:', error);
    }
}

listUsers();
