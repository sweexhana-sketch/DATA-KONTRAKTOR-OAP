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
            const { email, password } = credentials as Record<string, string>;
            nodeConsole.log('[Auth] Authorize attempt for:', email);
            if (!email || !password) return null;

            const users = await sql`SELECT id, email, name, password, role FROM auth_users WHERE email = ${email}`;
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

if (process.env.CORS_ORIGINS) {
  app.use(
    '/*',
    cors({
      origin: process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()),
    })
  );
}

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
