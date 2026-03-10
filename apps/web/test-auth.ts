// Mock import.meta.glob before importing
(globalThis as any).import = { meta: { glob: () => ({}), env: { DEV: true, NEXT_PUBLIC_CREATE_BASE_URL: '' } } };
Object.defineProperty(globalThis, 'import', { value: { meta: { glob: () => ({}), env: { DEV: true }, hot: null } } });

process.env.AUTH_SECRET = 'test-secret';
delete process.env.AUTH_URL;
delete process.env.NEXTAUTH_URL;
// Delete from Vite's import.meta.env if it exists
if (import.meta.env) {
    delete import.meta.env.AUTH_URL;
    delete import.meta.env.NEXTAUTH_URL;
}

import { app } from './__create/index';

async function test() {
    const req = new Request('http://localhost:4000/api/auth/csrf');
    const res = await app.fetch(req);
    console.log('Status:', res.status);
    console.log('Headers:', res.headers);
    const text = await res.text();
    console.log('Body:', text);
}

test().catch(console.error);
