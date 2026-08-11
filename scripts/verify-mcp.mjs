#!/usr/bin/env node
// scripts/verify-mcp.mjs
// Lance le serveur MCP, envoie initialize + tools/list + tools/call
// via stdin, collecte la sortie JSON-RPC, et l'imprime pour preuve.
//
// Usage : node scripts/verify-mcp.mjs

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const serverPath = path.join(root, 'mcp', 'server.mjs');

const proc = spawn('node', [serverPath], { stdio: ['pipe', 'pipe', 'pipe'] });

let stdout = '';
let stderr = '';
proc.stdout.on('data', (d) => { stdout += d.toString(); });
proc.stderr.on('data', (d) => { stderr += d.toString(); });

// JSON-RPC messages are newline-delimited (per LSP/MCP convention).
function send(msg) {
  proc.stdin.write(JSON.stringify(msg) + '\n');
}

function readMessages(buf) {
  return buf.split('\n').filter(Boolean).map((l) => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

async function main() {
  // 1. initialize
  send({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'verify', version: '0.0.0' },
    },
  });
  send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
  send({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: { name: 'collection.list', arguments: {} },
  });
  send({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'collection.create',
      arguments: { collectionId: 'tasks', fields: { label: 'From MCP', status: 'open' } },
    },
  });

  // Laisse le temps aux réponses d'arriver.
  await new Promise((r) => setTimeout(r, 800));
  proc.stdin.end();
  await new Promise((r) => proc.once('close', r));

  const messages = readMessages(stdout);
  console.log(`== MCP server: ${messages.length} messages ==`);
  for (const m of messages) {
    if (m.id === 1) {
      console.log('  initialize :', JSON.stringify(m.result?.serverInfo ?? m.result, null, 0).slice(0, 80));
    } else if (m.id === 2) {
      const tools = m.result?.tools ?? [];
      console.log(`  tools/list : ${tools.length} tools`);
      for (const t of tools.slice(0, 4)) {
        console.log(`    - ${t.name} (${t.description?.slice(0, 60)}...)`);
      }
      if (tools.length > 4) console.log(`    ... et ${tools.length - 4} autres`);
    } else if (m.id === 3) {
      const txt = m.result?.content?.[0]?.text ?? '';
      const parsed = JSON.parse(txt);
      console.log(`  tools/call collection.list : ${parsed.data?.count} collections`);
    } else if (m.id === 4) {
      const txt = m.result?.content?.[0]?.text ?? '';
      const parsed = JSON.parse(txt);
      console.log(`  tools/call collection.create : scenarioId=${parsed.data?.scenarioId} proposalId=${parsed.data?.proposalId}`);
      console.log(`    isError=${m.result?.isError} (false = outil a rendu une proposition, pas une erreur)`);
    } else {
      console.log(`  msg id=${m.id}:`, JSON.stringify(m).slice(0, 200));
    }
  }
  if (stderr) {
    console.log('-- stderr --');
    console.log(stderr);
  }
}

main().catch((err) => {
  console.error('verify-mcp failed:', err);
  process.exit(1);
});
