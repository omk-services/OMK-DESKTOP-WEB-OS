// src/lib/tooling/index.ts
// Point d'entrée public du module. Les adaptateurs et le catalogue
// sont re-exportés ici pour que les scripts CLI / MCP / REST restent
// concis.

export * from './types';
export { defineTool, parseArgs, toolResultToShort, TOOL_NAME } from './defineTool';
export { register, get, list, listByCategory, reset, subscribe } from './registry';
export { registerAll } from './catalog';
export * as collection from './catalog/collection';
export * as app from './catalog/app';
export * as scenario from './catalog/scenario';
export * as restAdapter from './adapters/rest';
export * as mcpAdapter from './adapters/mcp';
export * as mcpSchema from './adapters/mcp-schema';
export * as cliAdapter from './adapters/cli';
export * as skillAdapter from './adapters/skill';
export * as inAppAdapter from './adapters/in-app';
export * as serverStore from './serverStore';
