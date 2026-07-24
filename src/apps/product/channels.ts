/** Product channels — log of AI↔AI Manager→Worker handoffs (AgenticOS
 *  "channels" pattern). Each entry shows the full delegation chain with
 *  status, model, latency, and a short payload summary. Persisted client-side
 *  (no backend) so the prospect can see real activity. */
import { MessageSquare } from 'lucide-react';

export interface ChannelEntry {
  id: string;
  channel: string;        // e.g. 'roadmap-prioritization', 'q3-release-planning'
  manager: string;        // AI assistant name
  worker: string;         // AI assistant name
  task: string;           // short description
  payload?: string;       // JSON-like summary
  status: 'sent' | 'ack' | 'running' | 'done' | 'failed';
  model: string;          // e.g. 'gemma-4-free'
  latencyMs?: number;      // for done entries
  createdAt: string;      // ISO
  direction: 'mgr→wkr' | 'wkr→mgr' | 'mgr→human';
}

export const PRODUCT_CHANNELS: ChannelEntry[] = [
  {
    id: 'ch-001',
    channel: 'roadmap-prioritization',
    manager: 'Roadmap Strategist',
    worker: 'Sprint Planner',
    task: 'Break down Q3 feature "Session→Content Dam" into 3 sprints',
    payload: 'sprints: [discovery, build, polish] · est: 12pt',
    status: 'done',
    model: 'gemma-4-free',
    latencyMs: 2300,
    createdAt: '2026-07-23T14:02:11Z',
    direction: 'mgr→wkr',
  },
  {
    id: 'ch-002',
    channel: 'q3-release-planning',
    manager: 'Roadmap Strategist',
    worker: 'Release Notes Generator',
    task: 'Draft release notes for v0.3 (Session Transcript module)',
    status: 'done',
    model: 'gemma-4-free',
    latencyMs: 1850,
    createdAt: '2026-07-23T13:45:02Z',
    direction: 'mgr→wkr',
  },
  {
    id: 'ch-003',
    channel: 'spec-audit',
    manager: 'Spec Auditor',
    worker: 'Roadmap Strategist',
    task: 'Flag scope creep in "QuizResult" — 4 metrics instead of 2',
    payload: 'revert to 2; defer the rest to v0.5',
    status: 'ack',
    model: 'gemma-4-free',
    createdAt: '2026-07-23T11:18:50Z',
    direction: 'wkr→mgr',
  },
  {
    id: 'ch-004',
    channel: 'roadmap-prioritization',
    manager: 'Roadmap Strategist',
    worker: 'human (A+)',
    task: 'Approve: defer "Compliance Audit Pack" from Q3 to Q4?',
    payload: 'regulator timeline OK until 2026-09-15',
    status: 'sent',
    model: 'gemma-4-free',
    createdAt: '2026-07-23T10:54:33Z',
    direction: 'mgr→human',
  },
  {
    id: 'ch-005',
    channel: 'sprint-review',
    manager: 'Sprint Planner',
    worker: 'Spec Auditor',
    task: 'Verify "Replay" feature meets the 3 acceptance criteria',
    status: 'running',
    model: 'gemma-4-free',
    createdAt: '2026-07-23T16:21:09Z',
    direction: 'mgr→wkr',
  },
  {
    id: 'ch-006',
    channel: 'release-gate',
    manager: 'Release Notes Generator',
    worker: 'Spec Auditor',
    task: 'Final read-through before publishing v0.3.1 changelog',
    status: 'failed',
    model: 'gemma-4-free',
    latencyMs: 1100,
    createdAt: '2026-07-23T15:08:44Z',
    direction: 'mgr→wkr',
  },
];

/** Visual config per status — used by the Channels view in productApp */
export const CHANNEL_STATUS_META: Record<ChannelEntry['status'], { label: string; color: string; bg: string }> = {
  sent:     { label: 'Sent',     color: '#78716c', bg: '#f5f5f4' },
  ack:      { label: 'Acked',    color: '#1d4ed8', bg: '#dbeafe' },
  running:  { label: 'Running',  color: '#7c3aed', bg: '#ede9fe' },
  done:     { label: 'Done',     color: '#15803d', bg: '#dcfce7' },
  failed:   { label: 'Failed',   color: '#b91c1c', bg: '#fee2e2' },
};

/** Re-export the channel icon (used by the Channels section in the sidebar). */
export const CHANNEL_ICON = MessageSquare;
