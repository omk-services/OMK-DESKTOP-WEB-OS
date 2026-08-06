/**
 * security/index.ts — public surface of the dashboard / security app.
 *
 * Exports SECURITY_SECTIONS: AppSection[] in the exact shape DashboardApp.tsx
 * already consumes. The wiring into DashboardApp is the orchestrator's job,
 * not ours — see the cloisonnement note in the BRIEF.
 */
import { Power, ShieldAlert, Siren, Gauge, ShieldCheck, ClipboardCheck, Bell } from 'lucide-react';
import type { AppSection } from '../../../components/AppFrame';
import { KillSwitchesSection } from './KillSwitchesSection';
import { DlpSection } from './DlpSection';
import { PanicSection } from './PanicSection';
import { RateLimitsSection } from './RateLimitsSection';
import { PostureSection } from './PostureSection';
import { ComplianceSection } from './ComplianceSection';
import { AlertingSection } from './AlertingSection';

export const SECURITY_SECTIONS: AppSection[] = [
  { id: 'kill-switches', label: 'Kill Switches',    icon: Power,          render: () => <KillSwitchesSection /> },
  { id: 'dlp',           label: 'DLP & Exfil',      icon: ShieldAlert,    render: () => <DlpSection /> },
  { id: 'panic',         label: 'Panic',            icon: Siren,          render: () => <PanicSection /> },
  { id: 'rate-limits',   label: 'Rate Limits',      icon: Gauge,          render: () => <RateLimitsSection /> },
  { id: 'posture',       label: 'Security Posture', icon: ShieldCheck,    render: () => <PostureSection /> },
  { id: 'compliance',    label: 'Compliance',       icon: ClipboardCheck, render: () => <ComplianceSection /> },
  { id: 'alerting',      label: 'Alerting',         icon: Bell,           render: () => <AlertingSection /> },
];