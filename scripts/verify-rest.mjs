#!/usr/bin/env node
// scripts/verify-rest.mjs
// Test direct des handlers REST via fetch-like appels. Monte un
// mini-serveur Node sur 127.0.0.1 et vérifie les routes /api/v1.

import http from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
process.chdir(root);

// Import dynamique des handlers — ils vont registerAll() au chargement.
const { toolHandler } = await import('../dist/tooling/adapters/rest.js');
const { registerAll } = await import('../dist/tooling/catalog/index.js');
registerAll();

async function handleRequest(req, res) {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/v1/tools' && req.method === 'GET') {
    const { list } = await import('../dist/tooling/registry.js');
    const { manifestTools } = await import('../dist/tooling/adapters/rest.js');
    const body = JSON.stringify({ count: list().length, tools: manifestTools() });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(body);
    return;
  }
  const m = url.pathname.match(/^\/api\/v1\/([a-z0-9.-]+)$/);
  if (m && req.method === 'POST') {
    const toolName = m[1];
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString('utf8');
    const fakeRequest = new Request(`http://localhost${url.pathname}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-coach-os-tenant': 'rest-test' },
      body: raw,
    });
    const response = await toolHandler(toolName)(fakeRequest);
    const body = await response.text();
    res.writeHead(response.status, { 'Content-Type': 'application/json' });
    res.end(body);
    return;
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((err) => {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  });
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
console.log(`== REST server on 127.0.0.1:${port} ==`);

function call(method, pathname, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, method, path: pathname, headers: { 'Content-Type': 'application/json' } }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve({ status: res.statusCode, body: text });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const r1 = await call('GET', '/api/v1/tools');
const j1 = JSON.parse(r1.body);
console.log(`  GET  /api/v1/tools : ${r1.status} ${j1.count} tools`);

const r2 = await call('POST', '/api/v1/collection.list', {});
const j2 = JSON.parse(r2.body);
console.log(`  POST /api/v1/collection.list : ${r2.status} ${j2.data?.count} collections`);

const r3 = await call('POST', '/api/v1/collection.read', { collectionId: 'tasks' });
const j3 = JSON.parse(r3.body);
console.log(`  POST /api/v1/collection.read : ${r2.status} ${j3.data?.count} items`);

const r4 = await call('POST', '/api/v1/collection.create', { collectionId: 'tasks', fields: { label: 'From REST', status: 'open' } });
const j4 = JSON.parse(r4.body);
console.log(`  POST /api/v1/collection.create : ${r4.status} scenarioId=${j4.data?.scenarioId} proposalId=${j4.data?.proposalId}`);

const r5 = await call('POST', '/api/v1/collection.create', { collectionId: 'inconnue' });
const j5 = JSON.parse(r5.body);
console.log(`  POST /api/v1/collection.create (bad id) : ${r5.status} ok=${j5.ok} error=${j5.error}`);

const r6 = await call('POST', '/api/v1/inconnu', {});
console.log(`  POST /api/v1/inconnu : ${r6.status}`);

server.close();
