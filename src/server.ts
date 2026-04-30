import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { openDatabase } from './db.js';
import { createExportApi } from './export.js';
import { createProjectsApi } from './projects.js';

const db = openDatabase();
const app = new Hono();

app.use('*', secureHeaders());
app.use('*', logger());
app.use(
  '/api/*',
  cors({
    origin: process.env.CORS_ORIGIN ?? '*',
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type']
  })
);

app.get('/health', (c) =>
  c.json({
    ok: true,
    service: 'openspec-builder',
    time: new Date().toISOString()
  })
);

app.route('/api/projects', createProjectsApi(db));
app.route('/api/export', createExportApi(db));

app.get('/artifacts/:slug/wireframe/index.html', (c) =>
  c.redirect(`/artifacts/${c.req.param('slug')}/docs/wireframe/index.html`)
);
app.get('/artifacts/:slug/wireframe', (c) =>
  c.redirect(`/artifacts/${c.req.param('slug')}/docs/wireframe/index.html`)
);
app.use('/artifacts/*', serveStatic({ root: '/opt', rewriteRequestPath: (path) => path.replace(/^\/artifacts/, '') }));
app.get('/artifacts/*', (c) => c.json({ error: 'Artifact not found' }, 404));
app.use('/assets/*', serveStatic({ root: './dist' }));
app.use('/favicon.ico', serveStatic({ path: './dist/favicon.ico' }));
app.use('/logo.png', serveStatic({ path: './dist/logo.png' }));
app.get('*', serveStatic({ path: './dist/index.html' }));

app.notFound((c) => c.json({ error: 'Not found' }, 404));

app.onError((error, c) => {
  console.error(error);
  return c.json({ error: 'Internal server error' }, 500);
});

const port = Number(process.env.PORT ?? 3000);

serve(
  {
    fetch: app.fetch,
    port
  },
  (info) => {
    console.log(`OpenSpec-Builder API listening on http://localhost:${info.port}`);
  }
);

export { app };
