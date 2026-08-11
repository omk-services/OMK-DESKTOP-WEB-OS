// mcp/server.ts
// Serveur MCP stdio. Le wrapper `mcp.json` du plugin le lance via
// `node mcp/server.mjs`. JSON-RPC 2.0 sur stdin/stdout, conforme
// au SDK 1.x de @modelcontextprotocol/sdk.

import { runMcpStdio } from '../src/lib/tooling/adapters/mcp';

runMcpStdio().catch((err) => {
  // On écrit sur stderr — ne JAMAIS polluer stdout, c'est le canal
  // JSON-RPC du serveur.
  process.stderr.write(`MCP server failed: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
