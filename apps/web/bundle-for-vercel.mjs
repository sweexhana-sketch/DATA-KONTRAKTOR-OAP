/**
 * bundle-for-vercel.mjs
 * Post-build script that bundles the React Router + Hono server into a 
 * single self-contained file that Vercel can use as a serverless function.
 */
import { build } from 'esbuild';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('📦 Bundling server for Vercel deployment...');

// Ensure the build/server directory has the output from react-router build
const serverBuildPath = path.join(__dirname, 'build/server/index.js');
if (!fs.existsSync(serverBuildPath)) {
    console.error('❌ build/server/index.js not found! Run npm run build first.');
    process.exit(1);
}

// Bundle the server build + handler into a single self-contained file
try {
    await build({
        entryPoints: [path.join(__dirname, '__create/vercel-entry.mjs')],
        bundle: true,
        platform: 'node',
        target: 'node20',
        format: 'esm',
        outfile: path.join(__dirname, '../api/index.mjs'),
        external: [
            'node:*',
            'fsevents', // Optional MacOS dependency
        ],
        minify: true,
        sourcemap: true,
        logLevel: 'info',
        plugins: [
            {
                name: 'alias',
                setup(build) {
                    build.onResolve({ filter: /^@hono\/node-server$/ }, (args) => {
                        const mockPath = path.resolve(__dirname, '__create', 'mock-hono-server.js');
                        return { path: mockPath };
                    });
                },
            },
        ],
        define: {
            'process.env.NODE_ENV': '"production"'
        },
    });
} catch (e) {
    console.error('❌ Esbuild Build Failed:');
    if (e.errors) {
        e.errors.forEach(err => {
            console.error(`- Error: ${err.text}`);
            if (err.location) {
                console.error(`  Location: ${err.location.file}:${err.location.line}`);
            }
        });
    } else {
        console.error(e);
    }
    process.exit(1);
}

console.log('✅ Server bundled to ../api/index.mjs');
