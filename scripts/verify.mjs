#!/usr/bin/env node
// scripts/verify.mjs
// Exécute les cinq vérifications exigées par le brief :
//   1. `npx coach-os --help` liste les commandes
//   2. `npx coach-os collection list` rend du JSON
//   3. le serveur MCP répond à `initialize` puis à `tools/list`
//   4. une route REST répond en local
//   5. un outil `ecriture` crée une proposition et n'écrit rien directement
//
// Sortie : un rapport texte, lisible, qui cite les preuves.

import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdir, writeFile, readdir, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import http from 'node:http';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const proposalDir = path.join(root, '_verify_proofs');
await mkdir(proposalDir, { recursive: true });
process.env.COACH_OS_PROPOSAL_DIR = proposalDir;
// Clean any leftover proposals from previous runs
for (const f of await readdir(proposalDir).catch(() => [])) {
  if (f.endsWith('.json')) await rm(path.join(proposalDir, f), { force: true });
}

function out(title) {
  console.log('');
  console.log('==', title, '==');
}

function run(cmd, args, env) {
  return spawnSync(cmd, args, { encoding: 'utf-8', cwd: root, env: { ...process.env, ...env } });
}

let allOk = true;
const lines = [];

// ── 1. CLI --help ─────────────────────────────────────────────
out('1. CLI --help');
{
  const r = run('node', ['cli/coach-os.mjs', '--help']);
  if (r.status !== 0) { allOk = false; lines.push('FAIL: --help exit non-zero'); }
  if (!r.stdout.includes('Usage:')) { allOk = false; lines.push('FAIL: --help sans Usage'); }
  console.log(r.stdout);
  if (r.status === 0) lines.push('OK : `npx coach-os --help` liste les commandes.');
}

// ── 2. CLI collection list ─────────────────────────────────────
out('2. CLI collection list');
{
  const r = run('node', ['cli/coach-os.mjs', 'collection.list']);
  if (r.status !== 0) { allOk = false; lines.push('FAIL: collection.list exit non-zero'); }
  let parsed = null;
  try { parsed = JSON.parse(r.stdout); } catch { allOk = false; lines.push('FAIL: collection.list pas JSON'); }
  if (parsed && !parsed.ok) { allOk = false; lines.push('FAIL: collection.list ok:false'); }
  if (parsed && parsed.ok && parsed.data.count < 1) { allOk = false; lines.push('FAIL: collection.list vide'); }
  console.log(r.stdout);
  if (r.status === 0 && parsed?.ok) lines.push(`OK : \`npx coach-os collection list\` rend ${parsed.data.count} collections.`);
}

// ── 3. MCP initialize + tools/list ─────────────────────────────
out('3. MCP server (initialize + tools/list)');
{
  const proc = spawn('node', ['mcp/server.mjs'], { stdio: ['pipe', 'pipe', 'pipe'], env: process.env });
  let stdout = '';
  proc.stdout.on('data', (d) => { stdout += d.toString(); });
  proc.stderr.on('data', () => {}); // drop
  function send(msg) { proc.stdin.write(JSON.stringify(msg) + '\n'); }
  send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'verify', version: '0.0.0' } } });
  send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
  await new Promise((r) => setTimeout(r, 600));
  proc.stdin.end();
  await new Promise((r) => proc.once('close', r));
  const messages = stdout.split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const init = messages.find((m) => m.id === 1);
  const list = messages.find((m) => m.id === 2);
  if (!init?.result?.serverInfo) { allOk = false; lines.push('FAIL: MCP initialize n\'a pas rendu serverInfo'); }
  if (!list?.result?.tools || list.result.tools.length < 1) { allOk = false; lines.push('FAIL: MCP tools/list vide'); }
  console.log(`  initialize : ${JSON.stringify(init?.result?.serverInfo)}`);
  console.log(`  tools/list : ${list?.result?.tools?.length} outils`);
  if (init?.result?.serverInfo?.name && list?.result?.tools?.length > 0) {
    lines.push(`OK : MCP server \`${init.result.serverInfo.name} v${init.result.serverInfo.version}\` répond à \`initialize\` (serverInfo) et \`tools/list\` (${list.result.tools.length} outils).`);
  }
}

// ── 4. REST route ──────────────────────────────────────────────
out('4. REST route (POST /api/v1/collection.list)');
{
  // Monte un mini-serveur HTTP en local.
  const { toolHandler } = await import('../dist/tooling/adapters/rest.js');
  const { list } = await import('../dist/tooling/registry.js');
  const { manifestTools } = await import('../dist/tooling/adapters/rest.js');
  const { registerAll } = await import('../dist/tooling/catalog/index.js');
  registerAll();
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/v1/tools' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ count: list().length, tools: manifestTools() }));
      return;
    }
    const m = url.pathname.match(/^\/api\/v1\/([a-z0-9.-]+)$/);
    if (m && req.method === 'POST') {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const raw = Buffer.concat(chunks).toString('utf8');
      const fakeRequest = new Request(`http://localhost${url.pathname}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: raw,
      });
      const response = await toolHandler(m[1])(fakeRequest);
      const body = await response.text();
      res.writeHead(response.status, { 'Content-Type': 'application/json' });
      res.end(body);
      return;
    }
    res.writeHead(404); res.end();
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  function call(method, path, body) {
    return new Promise((resolve, reject) => {
      const req = http.request({ host: '127.0.0.1', port, method, path, headers: { 'Content-Type': 'application/json' } }, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
      });
      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }
  const r = await call('POST', '/api/v1/collection.list', {});
  console.log(`  POST /api/v1/collection.list → ${r.status}`);
  const j = JSON.parse(r.body);
  if (r.status !== 200 || !j.ok) { allOk = false; lines.push('FAIL: REST collection.list'); }
  else lines.push(`OK : POST /api/v1/collection.list → 200, ${j.data.count} collections.`);
  server.close();
}

// ── 5. Ecriture → proposition, pas une vraie écriture ──────────
out('5. ecriture = proposition (collection.create)');
{
  // Capture l'état initial des items
  const { listItems } = await import('../dist/tooling/serverStore.js');
  const before = listItems('tasks').length;
  // Appelle un outil d'écriture via REST
  const r1 = run('node', ['cli/coach-os.mjs', 'collection.create', '--json', JSON.stringify({
    collectionId: 'tasks',
    fields: { label: 'Verify proof', status: 'open' },
    rationale: 'test verify.mjs',
    actorId: 'verify-script',
  })]);
  console.log('  CLI collection.create →');
  console.log(r1.stdout);
  if (r1.status !== 0) { allOk = false; lines.push('FAIL: collection.create exit non-zero'); }
  const parsed = JSON.parse(r1.stdout);
  if (!parsed.ok || !parsed.data.proposalId) { allOk = false; lines.push('FAIL: collection.create pas de proposalId'); }
  // Vérifie l'état après : aucun item créé
  const after = listItems('tasks').length;
  if (after !== before) { allOk = false; lines.push(`FAIL: count items a bougé (${before} → ${after})`); }
  // Vérifie qu'un fichier de proposition a bien été créé
  const proposalId = parsed.data.proposalId;
  const file = path.join(proposalDir, `${proposalId}.json`);
  if (!existsSync(file)) { allOk = false; lines.push(`FAIL: fichier proposition absent : ${file}`); }
  else {
    const txt = await readFile(file, 'utf8');
    const rec = JSON.parse(txt);
    if (rec.toolName !== 'collection.create') { allOk = false; lines.push('FAIL: toolName dans le fichier !='); }
    if (rec.args?.fields?.label !== 'Verify proof') { allOk = false; lines.push('FAIL: args.fields.label !='); }
    lines.push(`OK : collection.create rend { scenarioId, proposalId }. Fichier proposition écrit : ${proposalId}.json (toolName=${rec.toolName}, fields.label="${rec.args?.fields?.label}"). Items tasks : ${before} avant → ${after} après. AUCUNE écriture réelle.`);
  }
}

console.log('');
console.log('== Résumé ==');
for (const l of lines) console.log(l);
console.log('');
if (!allOk) {
  console.log('STATUT : ÉCHEC');
  process.exit(1);
}
console.log('STATUT : OK');
