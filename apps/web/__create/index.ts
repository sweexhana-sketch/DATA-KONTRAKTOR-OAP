// @ts-nocheck
import { AsyncLocalStorage } from 'node:async_hooks';
import nodeConsole from 'node:console';
import { skipCSRFCheck } from '@auth/core';
import Credentials from '@auth/core/providers/credentials';
import { authHandler, initAuthConfig, type AuthEnv } from '@hono/auth-js';
import { hash, compare } from 'bcryptjs';
import { Hono } from 'hono';
import { contextStorage, getContext } from 'hono/context-storage';
import { cors } from 'hono/cors';
import { proxy } from 'hono/proxy';
import { bodyLimit } from 'hono/body-limit';
import { requestId } from 'hono/request-id';
import { createHonoServer } from 'react-router-hono-server/node';
import { serializeError } from 'serialize-error';
import { API_BASENAME, api } from './route-builder';
// @ts-ignore
import sql from '../src/app/api/utils/sql.js';
// @ts-ignore
import { syncToGoogleSheets } from '../src/app/api/utils/google-sheets.js';

const als = new AsyncLocalStorage<{ requestId: string }>();

// Disabling custom logging for Vercel debugging
/*
for (const method of ['log', 'info', 'warn', 'error', 'debug'] as const) {
  const original = nodeConsole[method].bind(console);

  console[method] = (...args: unknown[]) => {
    const requestId = als.getStore()?.requestId;
    if (requestId) {
      original(`[traceId:${requestId}]`, ...args);
    } else {
      original(...args);
    }
  };
}
*/

const app = new Hono<{ Bindings: AuthEnv; Variables: { requestId: string } }>();

// 1. Global Logging & Interception
app.use('*', async (c, next) => {
  console.log(`[Global Log] ${c.req.method} ${c.req.url} (path: ${c.req.path})`);
  await next();
});

const AUTH_SECRET = process['env'].AUTH_SECRET || 'dev-secret-please-change';

// 2. Auth Configuration & Handling (PRIORITY)
const authConfig = initAuthConfig((_c) => {
  return {
    secret: AUTH_SECRET,
    trustHost: true,
    basePath: '/api/auth',
    pages: {
      signIn: '/account/signin',
      signOut: '/account/logout',
    },
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
      async jwt({ token, user, account }) {
        if (user) {
          token.id = user.id;
          token.role = (user as any).role;
        }
        return token;
      },
      async session({ session, token }) {
        if (token && session.user) {
          (session.user as any).id = token.id;
          (session.user as any).role = token.role;
        }
        return session;
      },
      async redirect({ url, baseUrl }) {
        // Ensure redirects always stay within the same host on Vercel
        if (url.startsWith("/")) return `${baseUrl}${url}`;
        else if (new URL(url).origin === baseUrl) return url;
        return baseUrl;
      }
    },
    providers: [
      Credentials({
        id: 'credentials',
        name: 'Credentials',
        credentials: {
          email: { label: 'Email', type: 'text' },
          password: { label: 'Password', type: 'password' },
        },
        authorize: async (credentials) => {
          try {
            const { email: rawEmail, password } = credentials as Record<string, string>;
            const email = rawEmail?.toLowerCase().trim();
            nodeConsole.log('[Auth] Authorize attempt for:', email);
            if (!email || !password) return null;

            const users = await sql`SELECT id, email, name, password, role FROM auth_users WHERE email ILIKE ${email}`;
            const existing = users[0];

            if (existing && existing.password) {
              const ok = await compare(password, existing.password);
              if (ok) {
                nodeConsole.log('[Auth] Password verified for:', email);
                return {
                  id: existing.id,
                  email: existing.email,
                  name: existing.name ?? '',
                  role: existing.role
                };
              }
              nodeConsole.log('[Auth] Password mismatch for:', email);
            } else {
              nodeConsole.log('[Auth] User or password field not found for:', email);
            }
            return null;
          } catch (err) {
            nodeConsole.error('[Auth] Error in authorize function:', err);
            return null;
          }
        },
      }),
      Credentials({
        id: 'credentials-signup',
        name: 'Credentials Signup',
        credentials: {
          email: { label: 'Email', type: 'text' },
          password: { label: 'Password', type: 'password' },
          name: { label: 'Name', type: 'text' },
        },
        authorize: async (credentials) => {
          try {
            const { email, password, name } = credentials as Record<string, string>;
            if (!email || !password) return null;

            const existing = await sql`SELECT id FROM auth_users WHERE email = ${email}`;
            if (existing.length > 0) return null;

            const id = 'user_' + Date.now();
            const hashedPassword = await hash(password, 10);
            const result = await sql`
              INSERT INTO auth_users (id, email, name, password, role)
              VALUES (${id}, ${email}, ${name || ''}, ${hashedPassword}, 'user')
              RETURNING id, email, name, role
            `;
            const newUser = result[0];

            // Sync ke Google Sheets (DATA AKUN)
            try {
              syncToGoogleSheets({
                action: 'SIGNUP',
                user: newUser
              }).catch(e => nodeConsole.error('Safe to ignore: signup sync failed', e));
            } catch (e) {
              // Non-blocking
            }

            return {
              id: newUser.id,
              email: newUser.email,
              name: newUser.name,
              role: newUser.role
            };
          } catch (err) {
            nodeConsole.error('AUTH: Error in signup authorize function:', err);
            return null;
          }
        },
      }),
    ],
  };
});

app.use('/api/auth/*', authConfig);
app.all('/api/auth/*', authHandler());


// 3. Middlewares
app.use('*', async (c, next) => {
  // Polyfill headers.get if it's a plain object (common on some Vercel Node versions/drivers)
  const rawReq = c.req.raw as any;
  if (rawReq && rawReq.headers && typeof rawReq.headers.get !== 'function') {
    const headersObj = rawReq.headers;
    rawReq.headers.get = (name: string) => headersObj[name.toLowerCase()] || null;
  }
  await next();
});

// app.use(contextStorage()); // Keep this as it's safe and useful for Hono


app.onError((err, c) => {
  const isApi = c.req.path.startsWith('/api') || c.req.path.startsWith('/integrations');
  nodeConsole.error(`[Error] ${c.req.method} ${c.req.url}:`, err);

  if (isApi) {
    return c.json(
      {
        error: 'An error occurred in your app',
        message: err.message,
        details: serializeError(err),
      },
      500
    );
  }
  return c.html(getHTMLForErrorPage(err), 200 as any);
});

function getHTMLForErrorPage(err: any): string {
  return `
    <html>
      <head><title>Error</title></head>
      <body>
        <h1>An error occurred</h1>
        <pre>${err.stack || err.message}</pre>
      </body>
    </html>
  `;
}

app.use(
  '/*',
  cors({
    origin: (origin) => origin || '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'X-Requested-With', 'Accept'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  })
);

for (const method of ['post', 'put', 'patch'] as const) {
  app[method](
    '*',
    bodyLimit({
      maxSize: 4.5 * 1024 * 1024,
      onError: (c) => {
        return c.json({ error: 'Body size limit exceeded' }, 413);
      },
    })
  );
}

// ═══════════════════════════════════════════════════════════
// ENDPOINT INTEGRASI PUBLIK — untuk SI PRO & sistem external
// Tidak memerlukan cookie session, menggunakan optional API key
// ═══════════════════════════════════════════════════════════

// GET /api/integration/contractors — hanya kontraktor yang DITUNJUK
app.get('/api/integration/contractors', async (c) => {
  try {
    const apiKeyEnv = process.env.SIPRO_API_KEY;
    if (apiKeyEnv) {
      const providedKey = c.req.header('x-api-key') || c.req.query('api_key');
      if (providedKey !== apiKeyEnv) {
        return c.json({ error: 'Unauthorized: invalid or missing API key' }, 401);
      }
    }

    const status = c.req.query('status') || 'ditunjuk'; // DEFAULT: hanya ditunjuk
    const search = c.req.query('search');
    const limit  = parseInt(c.req.query('limit') || '500', 10);

    let query = 'SELECT id, company_name, full_name, company_type, small_classification, medium_classification, large_classification, city, status, created_at, updated_at FROM contractors WHERE 1=1';
    const params: any[] = [];
    let idx = 1;

    if (status && status !== 'all') {
      query += ` AND status = $${idx}`;
      params.push(status);
      idx++;
    }
    if (search) {
      query += ` AND (LOWER(full_name) LIKE LOWER($${idx}) OR LOWER(company_name) LIKE LOWER($${idx}))`;
      params.push(`%${search}%`);
      idx++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${idx}`;
    params.push(limit);

    nodeConsole.log(`[Integration] Executing query: ${query} with params: ${JSON.stringify(params)}`);
    const contractors = await sql(query, params);
    nodeConsole.log(`[Integration] Found ${contractors.length} contractors`);

    return c.json({
      success: true,
      total: contractors.length,
      contractors,
      synced_at: new Date().toISOString(),
      source: 'DATA-KONTRAKTOR-OAP',
    });
  } catch (err) {
    nodeConsole.error('[Integration] Error fetching contractors:', err);
    return c.json({ success: false, error: 'Internal Server Error' }, 500);
  }
});

// GET /api/integration/contractors/:id — detail satu kontraktor
app.get('/api/integration/contractors/:id', async (c) => {
  try {
    const apiKeyEnv = process.env.SIPRO_API_KEY;
    if (apiKeyEnv) {
      const providedKey = c.req.header('x-api-key') || c.req.query('api_key');
      if (providedKey !== apiKeyEnv) {
        return c.json({ error: 'Unauthorized: invalid or missing API key' }, 401);
      }
    }

    const id = c.req.param('id');
    const rows = await sql`SELECT * FROM contractors WHERE id = ${id} LIMIT 1`;
    if (!rows.length) return c.json({ success: false, error: 'Not found' }, 404);

    return c.json({ success: true, contractor: rows[0], source: 'DATA-KONTRAKTOR-OAP' });
  } catch (err) {
    nodeConsole.error('[Integration] Error fetching contractor by id:', err);
    return c.json({ success: false, error: 'Internal Server Error' }, 500);
  }
});

// GET /api/integration/debug-status — Cek koneksi DB & jumlah baris
app.get('/api/integration/debug-status', async (c) => {
  try {
    const totalCount = await sql('SELECT COUNT(*) as count FROM contractors');
    const tableList = await sql("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    const columnList = await sql("SELECT column_name FROM information_schema.columns WHERE table_name = 'contractors'");
    
    const sample = await sql('SELECT * FROM contractors LIMIT 5');
    
    const envVars = {
      has_db_url: !!process.env.DATABASE_URL,
      db_url_prefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 15) + '...' : 'none',
      node_env: process.env.NODE_ENV
    };
    
    return c.json({
      success: true,
      db_status: 'connected',
      total_in_db: totalCount[0]?.count || 0,
      tables: tableList.map((t: any) => t.table_name),
      contractor_columns: columnList.map((col: any) => col.column_name),
      sample_data: sample,
      environment: envVars,
      time: new Date().toISOString()
    });
  } catch (err: any) {
    return c.json({
      success: false,
      error: err.message,
      stack: err.stack,
      db_status: 'failed'
    }, 500);
  }
});

// GET /api/integration/stats — statistik ringkasan untuk SI PRO
app.get('/api/integration/stats', async (c) => {
  try {
    const apiKeyEnv = process.env.SIPRO_API_KEY;
    if (apiKeyEnv) {
      const providedKey = c.req.header('x-api-key') || c.req.query('api_key');
      if (providedKey !== apiKeyEnv) {
        return c.json({ error: 'Unauthorized: invalid or missing API key' }, 401);
      }
    }

    const [total, pending, approved, ditunjuk, rejected] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM contractors`,
      sql`SELECT COUNT(*) as count FROM contractors WHERE status = 'pending'`,
      sql`SELECT COUNT(*) as count FROM contractors WHERE status = 'approved'`,
      sql`SELECT COUNT(*) as count FROM contractors WHERE status = 'ditunjuk'`,
      sql`SELECT COUNT(*) as count FROM contractors WHERE status = 'rejected'`,
    ]);

    return c.json({
      success: true,
      stats: {
        total: parseInt(total[0].count),
        pending: parseInt(pending[0].count),
        approved: parseInt(approved[0].count),
        ditunjuk: parseInt(ditunjuk[0].count),
        rejected: parseInt(rejected[0].count),
      },
      synced_at: new Date().toISOString(),
      source: 'DATA-KONTRAKTOR-OAP',
    });
  } catch (err) {
    nodeConsole.error('[Integration] Error fetching stats:', err);
    return c.json({ success: false, error: 'Internal Server Error' }, 500);
  }
});

// 4. API Route mounting
app.route(API_BASENAME, api);

// 5. Integration Proxy
app.all('/integrations/:path{.+}', async (c) => {
  const queryParams = c.req.query();
  const url = `${process.env.NEXT_PUBLIC_CREATE_BASE_URL ?? 'https://www.create.xyz'}/integrations/${c.req.param('path')}${Object.keys(queryParams).length > 0 ? `?${new URLSearchParams(queryParams).toString()}` : ''}`;

  return proxy(url, {
    method: c.req.method,
    body: c.req.raw.body ?? null,
    // @ts-ignore
    duplex: 'half',
    redirect: 'manual',
    headers: {
      ...c.req.header(),
      'X-Forwarded-For': process.env.NEXT_PUBLIC_CREATE_HOST,
      'x-createxyz-host': process.env.NEXT_PUBLIC_CREATE_HOST,
      Host: process.env.NEXT_PUBLIC_CREATE_HOST,
      'x-createxyz-project-group-id': process.env.NEXT_PUBLIC_PROJECT_GROUP_ID,
    },
  });
});

export { app };
