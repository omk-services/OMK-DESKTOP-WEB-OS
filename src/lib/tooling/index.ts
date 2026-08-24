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
export * as webmcpAdapter from './adapters/webmcp';
export * as aguiAdapter from './adapters/agui';
export * as fcpAdapter from './adapters/fcp';
export * as tdfAdapter from './adapters/tdf';
export * as agentosAdapter from './adapters/agentos';
export * as rdfAgentAdapter from './adapters/rdf-agent';
export * as oapAdapter from './adapters/oap';
export * as tapAdapter from './adapters/tap';
export * as agpAdapter from './adapters/agp';
export * as acpIbmAdapter from './adapters/acp-ibm';
export * as a2pAdapter from './adapters/a2p';
export * as ucpAdapter from './adapters/ucp';
export * as a2uiAdapter from './adapters/a2ui';
export * as a2aAdapter from './adapters/a2a';
export * as acpAdapter from './adapters/acp';
export * as cliAdapter from './adapters/cli';
export * as skillAdapter from './adapters/skill';
export * as inAppAdapter from './adapters/in-app';
export * as serverStore from './serverStore';
export * as identity from './identity';
export * as permissions from './permissions';
export * as rbac from './rbac';
