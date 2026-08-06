import { useState } from 'react';
import type React from 'react';
import {
  BookOpen, Check, ChevronRight, CircleAlert, CircleCheck, Database,
  FileArchive, KeyRound, Layers3, Link2, LockKeyhole, Network, ShieldCheck,
  Sparkles, Users, X,
} from 'lucide-react';
import { AppFrame, type AppSection } from '../../../components/AppFrame';
import { Badge, StatCard } from '../../_ui/kit';
import { FleetItemCard, FleetItemGrid } from '../../_ui/FleetItemCard';
import { CONNECTORS, DOCUMENTS, MEMBERS, MEMORIES, ROLE_ORDER, type ConnectorState, type KnowledgeDocument, type MemberRole, type MemoryStatus } from './seed';

const ACCENT = '#7c3aed';

const stateMeta: Record<ConnectorState, { label: string; color: string; background: string }> = {
  connecte: { label: 'Connecté', color: '#15803d', background: '#dcfce7' },
  disponible: { label: 'Disponible', color: '#a16207', background: '#fef3c7' },
  indisponible: { label: 'Indisponible', color: '#b91c1c', background: '#fee2e2' },
};
const memoryMeta: Record<MemoryStatus, { color: string; background: string }> = {
  confirme: { color: '#15803d', background: '#dcfce7' },
  contredit: { color: '#b91c1c', background: '#fee2e2' },
  'a verifier': { color: '#a16207', background: '#fef3c7' },
};
const roleMeta: Record<MemberRole, { color: string; background: string; label: string }> = {
  viewer: { color: '#64748b', background: '#f1f5f9', label: 'Viewer' },
  analyst: { color: '#2563eb', background: '#dbeafe', label: 'Analyst' },
  operator: { color: '#7c3aed', background: '#ede9fe', label: 'Operator' },
  admin: { color: '#c2410c', background: '#ffedd5', label: 'Admin' },
  owner: { color: '#be123c', background: '#ffe4e6', label: 'Owner' },
};
const docState: Record<KnowledgeDocument['state'], { label: string; color: string }> = {
  depose: { label: 'Déposé', color: '#64748b' },
  extrait: { label: 'Extrait', color: '#2563eb' },
  decoupe: { label: 'Découpé', color: '#7c3aed' },
  vectorise: { label: 'Vectorisé', color: '#a16207' },
  interrogeable: { label: 'Interrogeable', color: '#15803d' },
};

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-surface)] shadow-sm ${className}`}>{children}</div>;
}

function SemanticPill({ children, color, background }: { children: React.ReactNode; color: string; background: string }) {
  return <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color, background }}>{children}</span>;
}

function PlatformHeader({ title, subtitle, icon: Icon, action }: { title: string; subtitle: string; icon: typeof Network; action?: React.ReactNode }) {
  return <div className="mb-6 flex items-start justify-between gap-4"><div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${ACCENT}18`, color: ACCENT }}><Icon className="h-5 w-5" /></div><div><h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--theme-text)' }}>{title}</h2><p className="mt-1 text-sm" style={{ color: 'var(--theme-muted)' }}>{subtitle}</p></div></div>{action}</div>;
}

function Integrations() {
  return <div className="p-7" style={{ color: 'var(--theme-text)' }}>
    <PlatformHeader title="Integrations" subtitle="Chaque connecteur expose une capacité précise via le gateway MCP." icon={Network} action={<Badge tone="ok">gateway opérationnel</Badge>} />
    <div className="mb-5 grid grid-cols-3 gap-3"><StatCard label="Connectés" value={CONNECTORS.filter(c => c.state === 'connecte').length} hint="accès actif" tone="ok" /><StatCard label="Disponibles" value={CONNECTORS.filter(c => c.state === 'disponible').length} hint="prêts à autoriser" tone="warn" /><StatCard label="Gateway" value="1" hint="point d’entrée unique" tone="accent" /></div>
    <FleetItemGrid cols={3}>{CONNECTORS.map((connector) => { const Icon = connector.icon; const meta = stateMeta[connector.state]; return <FleetItemCard key={connector.id} title={connector.name} subtitle={connector.access} description={connector.description} statusLabel={meta.label} statusTone={connector.state === 'connecte' ? 'ok' : connector.state === 'disponible' ? 'warn' : 'danger'} accent={ACCENT} icon={<Icon className="h-5 w-5" />} meta={connector.state === 'connecte' ? 'via agentgateway' : 'autorisation requise'} trailing={<ChevronRight className="h-4 w-4" style={{ color: meta.color }} />} />; })}</FleetItemGrid>
    <div className="mt-5 flex items-start gap-3 rounded-xl border border-[var(--panel-border)] p-4 text-xs" style={{ color: 'var(--theme-muted)' }}><ShieldCheck className="h-4 w-4 shrink-0" style={{ color: '#15803d' }} /><span>Le navigateur ne reçoit pas les secrets MCP : le gateway centralise le routage et le serveur décide des autorisations.</span></div>
  </div>;
}

function Knowledge() {
  const [selected, setSelected] = useState(DOCUMENTS[0]);
  return <div className="p-7" style={{ color: 'var(--theme-text)' }}>
    <PlatformHeader title="Knowledge" subtitle="Du dépôt à la question, chaque document garde son état et sa source." icon={BookOpen} action={<button className="rounded-lg px-3 py-2 text-xs font-bold" style={{ background: ACCENT, color: 'var(--theme-text)' }}>Déposer un document</button>} />
    <div className="mb-5 grid grid-cols-4 gap-3"><StatCard label="Documents" value={DOCUMENTS.length} hint="dans le dépôt" /><StatCard label="Chunks" value="89" hint="segments produits" tone="accent" /><StatCard label="Vectorisés" value="2" hint="index en cours" tone="warn" /><StatCard label="Interrogeables" value="1" hint="prêt pour le chat" tone="ok" /></div>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Panel><div className="border-b border-[var(--panel-border)] px-5 py-4"><div className="flex items-center justify-between"><h3 className="text-sm font-bold">Cycle documentaire</h3><span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>dépôt → RAG</span></div></div><div className="divide-y divide-[var(--panel-border)]">{DOCUMENTS.map((document) => { const state = docState[document.state]; return <button type="button" key={document.id} onClick={() => setSelected(document)} className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[var(--theme-surface-hover)]"><div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${state.color}18`, color: state.color }}><FileArchive className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="truncate text-sm font-semibold">{document.title}</span><span className="text-[10px]" style={{ color: 'var(--theme-muted)' }}>{document.type}</span></div><p className="mt-0.5 truncate text-xs" style={{ color: 'var(--theme-muted)' }}>{document.excerpt}</p></div><div className="text-right"><div className="text-[10px] font-bold" style={{ color: state.color }}>{state.label}</div><div className="mt-1 text-[10px]" style={{ color: 'var(--theme-muted)' }}>{document.chunks || '—'} chunks</div></div></button>; })}</div></Panel>
      <DocumentQuestion document={selected} />
    </div>
  </div>;
}

function DocumentQuestion({ document }: { document: KnowledgeDocument }) {
  const state = docState[document.state];
  return <Panel className="p-5"><div className="mb-4 flex items-center justify-between"><div><div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: ACCENT }}>Question au document</div><h3 className="mt-1 text-base font-bold">{document.title}</h3></div><SemanticPill color={state.color} background={`${state.color}18`}><CircleCheck className="h-3 w-3" />{state.label}</SemanticPill></div><div className="rounded-xl border border-[var(--panel-border)] p-3 text-xs" style={{ color: 'var(--theme-muted)' }}>Quel est le point essentiel à retenir pour la prochaine séance ?</div><div className="mt-4 rounded-xl p-4" style={{ background: `${ACCENT}0d` }}><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: ACCENT }}><Sparkles className="h-3 w-3" />Réponse</div><p className="text-sm leading-relaxed">{document.answer}</p></div><div className="mt-4 flex items-start gap-2 border-t border-[var(--panel-border)] pt-3 text-[11px]" style={{ color: 'var(--theme-muted)' }}><Link2 className="h-3.5 w-3.5 shrink-0" style={{ color: '#15803d' }} /><span>Source : <strong style={{ color: 'var(--theme-text)' }}>{document.source}</strong></span></div></Panel>;
}

function Memories() {
  const [scope, setScope] = useState<'all' | 'ruche' | 'agent'>('all');
  const records = MEMORIES.filter(m => scope === 'all' || m.scope === scope);
  return <div className="p-7" style={{ color: 'var(--theme-text)' }}>
    <PlatformHeader title="Memories" subtitle="La ruche partage le vérifié ; chaque agent garde son contexte propre." icon={Layers3} action={<div className="flex rounded-lg border border-[var(--panel-border)] p-0.5">{(['all', 'ruche', 'agent'] as const).map(item => <button type="button" key={item} onClick={() => setScope(item)} className="rounded-md px-2.5 py-1.5 text-[10px] font-bold" style={scope === item ? { background: `${ACCENT}18`, color: ACCENT } : { color: 'var(--theme-muted)' }}>{item === 'all' ? 'Tout' : item === 'ruche' ? 'Ruche' : 'Agent'}</button>)}</div>} />
    <div className="mb-5 grid grid-cols-4 gap-3"><StatCard label="Souvenirs" value={MEMORIES.length} hint="bruts + vérifiés" /><StatCard label="Confirmés" value={MEMORIES.filter(m => m.status === 'confirme').length} hint="transmissibles" tone="ok" /><StatCard label="À vérifier" value={MEMORIES.filter(m => m.status === 'a verifier').length} hint="ne pas propager" tone="warn" /><StatCard label="Contredits" value={MEMORIES.filter(m => m.status === 'contredit').length} hint="écartés de la ruche" tone="danger" /></div>
    <Panel><div className="flex items-center gap-3 border-b border-[var(--panel-border)] px-5 py-4"><Database className="h-4 w-4" style={{ color: ACCENT }} /><div><h3 className="text-sm font-bold">Hygiène de la mémoire</h3><p className="text-[11px]" style={{ color: 'var(--theme-muted)' }}>La provenance et le statut priment sur la quantité.</p></div></div><div className="divide-y divide-[var(--panel-border)]">{records.map(memory => { const status = memoryMeta[memory.status]; return <div key={memory.id} className="grid grid-cols-[1fr_auto] gap-4 px-5 py-4 md:grid-cols-[1fr_180px_100px]"><div><div className="flex items-center gap-2"><span className="text-sm font-semibold">{memory.fact}</span><SemanticPill color={status.color} background={status.background}>{memory.status === 'confirme' ? <Check className="h-3 w-3" /> : memory.status === 'contredit' ? <X className="h-3 w-3" /> : <CircleAlert className="h-3 w-3" />}{memory.status}</SemanticPill></div><div className="mt-1 flex items-center gap-2 text-[11px]" style={{ color: 'var(--theme-muted)' }}><span>{memory.provenance}</span><span>·</span><span>{memory.date}</span></div></div><div className="hidden text-xs md:block" style={{ color: 'var(--theme-muted)' }}><span className="font-semibold">{memory.scope === 'ruche' ? 'Ruche partagée' : memory.agent}</span><br />{memory.weight} poids</div><div className="text-right text-[10px] uppercase tracking-wider" style={{ color: memory.scope === 'ruche' ? ACCENT : 'var(--theme-muted)' }}>{memory.scope}</div></div>; })}</div></Panel>
  </div>;
}

function Members() {
  return <div className="p-7" style={{ color: 'var(--theme-text)' }}>
    <PlatformHeader title="Members" subtitle="Les onglets se masquent côté interface ; l’autorité reste au serveur." icon={Users} action={<button type="button" className="rounded-lg px-3 py-2 text-xs font-bold" style={{ background: ACCENT, color: 'var(--theme-text)' }}>Inviter un membre</button>} />
    <div className="mb-5 grid grid-cols-3 gap-3"><StatCard label="Membres" value={MEMBERS.length} hint="accès nominatifs" /><StatCard label="Rôles" value={ROLE_ORDER.length} hint="viewer → owner" tone="accent" /><StatCard label="Audit" value="100%" hint="changements attribués" tone="ok" /></div>
    <Panel><div className="grid grid-cols-[1fr_120px_1fr_120px] gap-4 border-b border-[var(--panel-border)] px-5 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}><span>Membre</span><span>Rôle</span><span>Accès ouvert</span><span>Dernière activité</span></div><div className="divide-y divide-[var(--panel-border)]">{MEMBERS.map(member => { const role = roleMeta[member.role]; return <div key={member.id} className="grid grid-cols-[1fr_120px_1fr_120px] items-center gap-4 px-5 py-4"><div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold" style={{ background: ACCENT, color: 'var(--theme-text)' }}>{member.initials}</div><div className="min-w-0"><div className="truncate text-sm font-semibold">{member.name}</div><div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--theme-muted)' }}><KeyRound className="h-3 w-3" /> acteur : {member.actor}</div></div></div><div><SemanticPill color={role.color} background={role.background}>{role.label}</SemanticPill></div><div className="text-xs" style={{ color: 'var(--theme-muted)' }}>{member.opens}</div><div className="text-right text-[11px]" style={{ color: 'var(--theme-muted)' }}>{member.activity}</div></div>; })}</div></Panel>
    <div className="mt-5 flex items-start gap-3 rounded-xl border border-[var(--panel-border)] p-4 text-xs" style={{ color: 'var(--theme-muted)' }}><LockKeyhole className="h-4 w-4 shrink-0" style={{ color: '#b91c1c' }} /><span>Chaque changement de privilège doit être attribué à une personne réelle. Les contrôles serveur et les politiques de données ne dépendent pas de cette vue.</span></div>
  </div>;
}

export const PLATFORM_SECTIONS: AppSection[] = [
  { id: 'integrations', label: 'Integrations', icon: Network, render: () => <Integrations /> },
  { id: 'knowledge', label: 'Knowledge', icon: BookOpen, render: () => <Knowledge /> },
  { id: 'memories', label: 'Memories', icon: Layers3, render: () => <Memories /> },
  { id: 'members', label: 'Members', icon: Users, render: () => <Members /> },
];

export function PlatformAppFrame() {
  return <AppFrame title="Platform" subtitle="Enterprise OS" icon={Network} accent={ACCENT} sections={PLATFORM_SECTIONS} />;
}
