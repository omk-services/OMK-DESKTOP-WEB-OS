import { useRef, useState } from 'react';
import type React from 'react';
import {
  BookOpen, Check, ChevronRight, CircleAlert, CircleCheck, Database,
  FileArchive, FilePlus, KeyRound, Layers3, Link2, LockKeyhole, Mail, Network,
  ShieldCheck, Sparkles, Upload, Users, X,
} from 'lucide-react';
import { AppFrame, type AppSection } from '../../../components/AppFrame';
import { useShellStore } from '../../../stores/shell.store';
import { Badge, StatCard } from '../../_ui/kit';
import { FleetItemCard, FleetItemGrid } from '../../_ui/FleetItemCard';
import { CONNECTORS, DOCUMENTS, MEMBERS, MEMORIES, ROLE_ORDER, type ConnectorSeed, type ConnectorState, type KnowledgeDocument, type MemberRecord, type MemberRole, type MemoryStatus } from './seed';

const ACCENT = '#7c3aed';

// Cycle d'état d'un connecteur quand on clique. Le clic avance dans le
// cycle, ce qui permet d'autoriser / déconnecter / demander l'accès à
// partir du même geste. `indisponible` part vers `disponible` (demande),
// `disponible` vers `connecte` (autorisation accordée), `connecte` vers
// `disponible` (déconnecte proprement). La logique serveur remplacera ce
// cycle par un vrai protocole OAuth via le gateway MCP ; en attendant,
// l'UI reflète l'état local de manière honnête.
const CONNECTOR_CYCLE: Record<ConnectorState, ConnectorState> = {
  connecte: 'disponible',
  disponible: 'connecte',
  indisponible: 'disponible',
};

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
  const addToast = useShellStore((s) => s.addToast);
  // L'état local permet au clic de cycler entre connecte / disponible /
  // indisponible. Le clic avance dans le cycle ; le compteur visible dans
  // les StatCards dérive du tableau local, ce qui rend le changement
  // mesurable à l'œil.
  const [connectors, setConnectors] = useState<ConnectorSeed[]>(CONNECTORS);

  const cycleConnector = (id: string) => {
    // On lit d'abord l'état courant pour calculer la transition, puis on
    // appelle addToast EN DEHORS du setter (sinon React hurle « setState
    // during render » : l'updater de setState est exécuté pendant le
    // render du prochain tick).
    const current = connectors.find((c) => c.id === id);
    if (!current) return;
    const next = CONNECTOR_CYCLE[current.state];
    addToast({
      source: 'Integrations',
      type: 'info',
      message: `${current.name} : ${stateMeta[current.state].label} → ${stateMeta[next].label}. Le serveur confirmera via le gateway.`,
    });
    setConnectors((prev) => prev.map((c) => (c.id === id ? { ...c, state: next } : c)));
  };

  const connected = connectors.filter(c => c.state === 'connecte').length;
  const available = connectors.filter(c => c.state === 'disponible').length;

  return <div className="p-7" style={{ color: 'var(--theme-text)' }}>
    <PlatformHeader title="Integrations" subtitle="Chaque connecteur expose une capacité précise via le gateway MCP." icon={Network} action={<Badge tone="ok">gateway opérationnel</Badge>} />
    <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3"><StatCard label="Connectés" value={connected} hint="accès actif" tone="ok" /><StatCard label="Disponibles" value={available} hint="prêts à autoriser" tone="warn" /><StatCard label="Gateway" value="1" hint="point d’entrée unique" tone="accent" /></div>
    <FleetItemGrid cols={3}>
      {connectors.map((connector) => {
        const Icon = connector.icon;
        const meta = stateMeta[connector.state];
        return (
          <div key={connector.id} data-connector-id={connector.id}>
            <FleetItemCard
              title={connector.name}
              subtitle={connector.access}
              description={connector.description}
              statusLabel={meta.label}
              statusTone={connector.state === 'connecte' ? 'ok' : connector.state === 'disponible' ? 'warn' : 'danger'}
              accent={ACCENT}
              icon={<Icon className="h-5 w-5" />}
              meta={connector.state === 'connecte' ? 'via agentgateway' : 'autorisation requise'}
              trailing={<ChevronRight className="h-4 w-4" style={{ color: meta.color }} />}
              onClick={() => cycleConnector(connector.id)}
            />
          </div>
        );
      })}
    </FleetItemGrid>
    <div className="mt-5 flex items-start gap-3 rounded-xl border border-[var(--panel-border)] p-4 text-xs" style={{ color: 'var(--theme-muted)' }}><ShieldCheck className="h-4 w-4 shrink-0" style={{ color: '#15803d' }} /><span>Le navigateur ne reçoit pas les secrets MCP : le gateway centralise le routage et le serveur décide des autorisations.</span></div>
  </div>;
}

function Knowledge() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>(DOCUMENTS);
  const [selected, setSelected] = useState<KnowledgeDocument>(DOCUMENTS[0]);
  const addToast = useShellStore((s) => s.addToast);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // The list of accepted extensions matches the formats the page already
  // announces in the cycle (PDF, DOCX, MD). 10 MB matches the typical
  // RAG ingest limit and stays well below localStorage quotas.
  const ACCEPTED_EXTENSIONS = ['pdf', 'docx', 'md'] as const;
  const MAX_SIZE_BYTES = 10 * 1024 * 1024;
  const ACCEPT_ATTR = '.pdf,.docx,.md';

  // Counts derived from the live list — no hardcoded magic numbers. A freshly
  // deposited document has 0 chunks and is in state 'depose', so it bumps
  // Documents by 1 and leaves the other three counters alone. The lack of
  // movement is the proof that the counter can move.
  const chunksTotal = documents.reduce((acc, d) => acc + d.chunks, 0);
  const vectorised = documents.filter((d) => d.state === 'vectorise' || d.state === 'interrogeable').length;
  const interrogeable = documents.filter((d) => d.state === 'interrogeable').length;

  const handleOpenPicker = (): void => {
    fileInputRef.current?.click();
  };

  const handlePickerChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    // Reset the input value so the same file can be picked again later.
    event.target.value = '';
    if (!file) {
      addToast({
        source: 'Knowledge',
        type: 'info',
        message: 'Dépôt annulé.',
      });
      return;
    }
    const dot = file.name.lastIndexOf('.');
    const ext = dot === -1 ? '' : file.name.slice(dot + 1).toLowerCase();
    if (!ext || !(ACCEPTED_EXTENSIONS as readonly string[]).includes(ext)) {
      addToast({
        source: 'Knowledge',
        type: 'error',
        message: `Format non supporté : .${ext || '?'}. Le dépôt accepte PDF, DOCX et MD.`,
      });
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      addToast({
        source: 'Knowledge',
        type: 'error',
        message: `Fichier trop volumineux (${sizeMb} Mo) — limite 10 Mo. Réduis la taille ou découpe en plusieurs dépôts.`,
      });
      return;
    }
    const newDoc: KnowledgeDocument = {
      id: `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      title: file.name,
      type: ext.toUpperCase(),
      state: 'depose',
      chunks: 0,
      updated: formatToday(),
      excerpt: `${formatSize(file.size)} · en attente de découpage et vectorisation.`,
      answer: 'Document fraîchement déposé. Aucune réponse tant que le pipeline RAG ne l\'a pas découpé et vectorisé.',
      source: 'dépôt local',
    };
    setDocuments((prev) => [newDoc, ...prev]);
    setSelected(newDoc);
    addToast({
      source: 'Knowledge',
      type: 'success',
      message: `${file.name} déposé · en attente de découpage`,
    });
  };

  return <div className="p-7" style={{ color: 'var(--theme-text)' }}>
    <PlatformHeader title="Knowledge" subtitle="Du dépôt à la question, chaque document garde son état et sa source." icon={BookOpen} action={
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_ATTR}
          onChange={handlePickerChange}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
        <button
          type="button"
          onClick={handleOpenPicker}
          data-action="deposit-document"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all hover:brightness-110 active:scale-[0.99]"
          style={{ background: ACCENT, color: '#ffffff' }}
        >
          <Upload className="h-3.5 w-3.5" /> Déposer un document
        </button>
      </div>
    } />
    <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4"><StatCard label="Documents" value={documents.length} hint="dans le dépôt" /><StatCard label="Chunks" value={chunksTotal} hint="segments produits" tone="accent" /><StatCard label="Vectorisés" value={vectorised} hint="index en cours" tone="warn" /><StatCard label="Interrogeables" value={interrogeable} hint="prêt pour le chat" tone="ok" /></div>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Panel><div className="border-b border-[var(--panel-border)] px-5 py-4"><div className="flex items-center justify-between"><h3 className="text-sm font-bold">Cycle documentaire</h3><span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>dépôt → RAG</span></div></div>
        {documents.length === 0 ? (
          <EmptyDocuments onPick={handleOpenPicker} />
        ) : (
          <div className="divide-y divide-[var(--panel-border)]">{documents.map((document) => { const state = docState[document.state]; return <button type="button" key={document.id} onClick={() => setSelected(document)} className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[var(--theme-surface-hover)]"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: `${state.color}18`, color: state.color }}><FileArchive className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="truncate text-sm font-semibold">{document.title}</span><span className="text-[10px]" style={{ color: 'var(--theme-muted)' }}>{document.type}</span></div><p className="mt-0.5 truncate text-xs" style={{ color: 'var(--theme-muted)' }}>{document.excerpt}</p></div><div className="shrink-0 text-right"><div className="text-[10px] font-bold" style={{ color: state.color }}>{state.label}</div><div className="mt-1 text-[10px]" style={{ color: 'var(--theme-muted)' }}>{document.chunks || '—'} chunks</div></div></button>; })}</div>
        )}
      </Panel>
      <DocumentQuestion document={selected} />
    </div>
  </div>;
}

function formatToday(): string {
  const d = new Date();
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleDateString('fr-FR', { month: 'long' });
  return `${day} ${month} ${d.getFullYear()}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function EmptyDocuments({ onPick }: { onPick: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--theme-surface-hover)' }}>
        <FilePlus className="h-4 w-4" style={{ color: 'var(--theme-muted)' }} />
      </div>
      <div className="text-[13px] font-semibold" style={{ color: 'var(--theme-text)' }}>Aucun document dans le dépôt</div>
      <div className="max-w-sm text-[11.5px]" style={{ color: 'var(--theme-muted)' }}>
        Dépose un PDF, DOCX ou MD pour démarrer le cycle d'indexation. Le pipeline de découpage et vectorisation n'est pas branché — les documents restent en état « Déposé » en attendant.
      </div>
      <button
        type="button"
        onClick={onPick}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold transition-all hover:brightness-110 active:scale-[0.99]"
        style={{ background: 'var(--theme-surface-hover)', color: 'var(--theme-text)', border: '1px solid var(--panel-border)' }}
      >
        <Upload className="h-3.5 w-3.5" /> Déposer un document
      </button>
    </div>
  );
}

function DocumentQuestion({ document }: { document: KnowledgeDocument }) {
  const state = docState[document.state];
  return (
    <Panel className="p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: ACCENT }}>Question au document</div>
          <h3
            className="mt-1 text-base font-bold"
            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {document.title}
          </h3>
        </div>
        <SemanticPill color={state.color} background={`${state.color}18`}>
          <CircleCheck className="h-3 w-3" />{state.label}
        </SemanticPill>
      </div>
      <div className="rounded-xl border border-[var(--panel-border)] p-3 text-xs" style={{ color: 'var(--theme-muted)' }}>
        Quel est le point essentiel à retenir pour la prochaine séance ?
      </div>
      <div className="mt-4 rounded-xl p-4" style={{ background: `${ACCENT}0d` }}>
        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: ACCENT }}>
          <Sparkles className="h-3 w-3" />Réponse
        </div>
        <p className="text-sm leading-relaxed">{document.answer}</p>
      </div>
      <div className="mt-4 flex items-start gap-2 border-t border-[var(--panel-border)] pt-3 text-[11px]" style={{ color: 'var(--theme-muted)' }}>
        <Link2 className="h-3.5 w-3.5 shrink-0" style={{ color: '#15803d' }} />
        <span>Source : <strong style={{ color: 'var(--theme-text)' }}>{document.source}</strong></span>
      </div>
    </Panel>
  );
}

function Memories() {
  const [scope, setScope] = useState<'all' | 'ruche' | 'agent'>('all');
  const records = MEMORIES.filter(m => scope === 'all' || m.scope === scope);
  return <div className="p-7" style={{ color: 'var(--theme-text)' }}>
    <PlatformHeader title="Memories" subtitle="La ruche partage le vérifié ; chaque agent garde son contexte propre." icon={Layers3} action={<div className="flex rounded-lg border border-[var(--panel-border)] p-0.5">{(['all', 'ruche', 'agent'] as const).map(item => <button type="button" key={item} onClick={() => setScope(item)} className="rounded-md px-2.5 py-1.5 text-[10px] font-bold" style={scope === item ? { background: `${ACCENT}18`, color: ACCENT } : { color: 'var(--theme-muted)' }}>{item === 'all' ? 'Tout' : item === 'ruche' ? 'Ruche' : 'Agent'}</button>)}</div>} />
    <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4"><StatCard label="Souvenirs" value={MEMORIES.length} hint="bruts + vérifiés" /><StatCard label="Confirmés" value={MEMORIES.filter(m => m.status === 'confirme').length} hint="transmissibles" tone="ok" /><StatCard label="À vérifier" value={MEMORIES.filter(m => m.status === 'a verifier').length} hint="ne pas propager" tone="warn" /><StatCard label="Contredits" value={MEMORIES.filter(m => m.status === 'contredit').length} hint="écartés de la ruche" tone="danger" /></div>
    <Panel><div className="flex items-center gap-3 border-b border-[var(--panel-border)] px-5 py-4"><Database className="h-4 w-4" style={{ color: ACCENT }} /><div><h3 className="text-sm font-bold">Hygiène de la mémoire</h3><p className="text-[11px]" style={{ color: 'var(--theme-muted)' }}>La provenance et le statut priment sur la quantité.</p></div></div><div className="divide-y divide-[var(--panel-border)]">{records.map(memory => { const status = memoryMeta[memory.status]; return <div key={memory.id} className="grid grid-cols-[1fr_auto] gap-4 px-5 py-4 md:grid-cols-[1fr_180px_100px]"><div><div className="flex items-center gap-2"><span className="text-sm font-semibold">{memory.fact}</span><SemanticPill color={status.color} background={status.background}>{memory.status === 'confirme' ? <Check className="h-3 w-3" /> : memory.status === 'contredit' ? <X className="h-3 w-3" /> : <CircleAlert className="h-3 w-3" />}{memory.status}</SemanticPill></div><div className="mt-1 flex items-center gap-2 text-[11px]" style={{ color: 'var(--theme-muted)' }}><span>{memory.provenance}</span><span>·</span><span>{memory.date}</span></div></div><div className="hidden text-xs md:block" style={{ color: 'var(--theme-muted)' }}><span className="font-semibold">{memory.scope === 'ruche' ? 'Ruche partagée' : memory.agent}</span><br />{memory.weight} poids</div><div className="text-right text-[10px] uppercase tracking-wider" style={{ color: memory.scope === 'ruche' ? ACCENT : 'var(--theme-muted)' }}>{memory.scope}</div></div>; })}</div></Panel>
  </div>;
}

function Members() {
  const addToast = useShellStore((s) => s.addToast);
  // État local : la file de membres part du seed (5 comptes actifs) et
  // s'enrichit des invitations émises par l'UI. Tant que le serveur ne
  // confirme pas, ces ajouts sont marqués « pending ».
  const [members, setMembers] = useState<MemberRecord[]>(MEMBERS);
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('analyst');
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Audit coverage: every member row has an attributed actor in the seed —
  // 100% holds, but we derive it from data so adding an unattributed row
  // would drop the badge to "4/5 attribués". Une invitation « pending »
  // n'est pas comptée comme attribuée tant que personne ne l'a validée.
  const attributed = members.filter((m) => (m.invitationStatus !== 'pending') && m.actor && m.actor.trim().length > 0).length;
  const auditPct = members.length === 0 ? 0 : Math.round((attributed / members.length) * 100);

  const resetInviteForm = () => {
    setInviting(false);
    setInviteEmail('');
    setInviteRole('analyst');
    setInviteError(null);
  };

  const submitInvite = () => {
    const email = inviteEmail.trim().toLowerCase();
    // Validation minimale côté client : un email avec un @ et un point.
    // Le serveur refera la validation propre. Ici on refuse ce qui est
    // manifestement faux, pas ce qui est subtilement faux.
    if (!email) {
      setInviteError("L'email est obligatoire.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInviteError("Cet email ne ressemble pas à un email.");
      return;
    }
    if (members.some((m) => (m.email ?? '').trim().toLowerCase() === email)) {
      setInviteError(`Une invitation existe déjà pour ${email}.`);
      return;
    }
    const initials = email
      .split('@')[0]
      .split(/[._-]+/)
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('') || '??';
    const role = roleMeta[inviteRole];
    const newMember: MemberRecord = {
      id: `invite-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name: email,
      initials,
      role: inviteRole,
      opens: role.label,
      activity: 'Invitation en attente',
      actor: '—',
      invitationStatus: 'pending',
      email,
    };
    setMembers((prev) => [newMember, ...prev]);
    addToast({
      source: 'Members',
      type: 'info',
      message: `Invitation enregistrée pour ${email} (${role.label}). Elle sera envoyée quand le serveur validera l'invitation.`,
    });
    resetInviteForm();
  };

  const pendingCount = members.filter((m) => m.invitationStatus === 'pending').length;

  return <div className="p-7" style={{ color: 'var(--theme-text)' }}>
    <PlatformHeader
      title="Members"
      subtitle="Les onglets se masquent côté interface ; l’autorité reste au serveur."
      icon={Users}
      action={
        <div className="flex items-center gap-2">
          {pendingCount > 0 && <Badge tone="warn">{pendingCount} en attente</Badge>}
          <button
            type="button"
            onClick={() => setInviting((v) => !v)}
            data-invite-toggle
            className="rounded-lg px-3 py-2 text-xs font-bold"
            style={{ background: ACCENT, color: 'var(--theme-text)' }}
          >
            {inviting ? 'Annuler' : 'Inviter un membre'}
          </button>
        </div>
      }
    />

    {inviting && (
      <div
        data-invite-form
        className="mb-5 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-solid)] p-4 flex flex-col gap-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11.5px] font-bold" style={{ color: 'var(--theme-text)' }}>
            <Mail className="h-4 w-4" style={{ color: ACCENT }} />
            Nouvelle invitation
          </div>
          <button
            type="button"
            onClick={resetInviteForm}
            aria-label="Annuler l'invitation"
            className="text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
            Email *
          </span>
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Ex : amadeus@coach-os.fr"
            className="px-2.5 py-1.5 rounded-lg text-[12px] outline-none"
            style={{ background: 'var(--theme-bg)', color: 'var(--theme-text)', border: '1px solid var(--panel-border)' }}
            data-invite-email
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') submitInvite(); }}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
            Rôle
          </span>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as MemberRole)}
            className="px-2.5 py-1.5 rounded-lg text-[12px] outline-none"
            style={{ background: 'var(--theme-bg)', color: 'var(--theme-text)', border: '1px solid var(--panel-border)' }}
            data-invite-role
          >
            {ROLE_ORDER.map((r) => (
              <option key={r} value={r}>{roleMeta[r].label}</option>
            ))}
          </select>
        </label>

        {inviteError && (
          <div
            role="alert"
            data-invite-error
            className="text-[11px] rounded-lg px-3 py-2"
            style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
          >
            {inviteError}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={resetInviteForm}
            className="text-[11px] font-semibold px-3 h-7 rounded-lg"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={submitInvite}
            data-invite-submit
            className="text-[11px] font-bold text-[color:#fff] h-7 px-3 rounded-lg"
            style={{ background: '#059669' }}
          >
            Envoyer l'invitation
          </button>
        </div>
      </div>
    )}

    <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <StatCard label="Membres" value={members.length} hint={pendingCount > 0 ? `${pendingCount} en attente` : 'accès nominatifs'} />
      <StatCard label="Rôles" value={ROLE_ORDER.length} hint="viewer → owner" tone="accent" />
      <StatCard label="Audit" value={`${auditPct}%`} hint={auditPct === 100 ? 'changements attribués' : `${attributed}/${members.length} attribués`} tone={auditPct === 100 ? 'ok' : 'warn'} />
    </div>

    <Panel>
      <div className="grid grid-cols-1 gap-3 border-b border-[var(--panel-border)] px-5 py-3 text-[10px] font-bold uppercase tracking-wider md:grid-cols-[1fr_140px_1fr_120px]" style={{ color: 'var(--theme-muted)' }}>
        <span>Membre</span>
        <span className="hidden md:inline">Rôle</span>
        <span className="hidden md:inline">Accès ouvert</span>
        <span className="hidden md:inline">Dernière activité</span>
      </div>
      <div className="divide-y divide-[var(--panel-border)]">
        {members.map(member => {
          const role = roleMeta[member.role];
          const isPending = member.invitationStatus === 'pending';
          return (
            <div
              key={member.id}
              data-member-id={member.id}
              data-member-status={isPending ? 'pending' : 'active'}
              className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-[1fr_140px_1fr_120px] md:items-center md:gap-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{ background: isPending ? 'var(--theme-surface-hover)' : ACCENT, color: isPending ? 'var(--theme-text-muted)' : '#ffffff' }}
                >
                  {member.initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 truncate text-sm font-semibold">
                    <span className="truncate">{member.name}</span>
                    {isPending && (
                      <span
                        className="shrink-0 inline-flex items-center text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{ background: '#fef3c7', color: '#a16207', border: '1px solid #fcd34d' }}
                        data-member-pending-badge
                      >
                        Invitation en attente
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--theme-muted)' }}>
                    <KeyRound className="h-3 w-3" /> acteur : {member.actor}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <SemanticPill color={role.color} background={role.background}>{role.label}</SemanticPill>
              </div>
              <div className="text-xs" style={{ color: 'var(--theme-muted)' }}>{member.opens}</div>
              <div className="text-right text-[11px]" style={{ color: 'var(--theme-muted)' }}>{member.activity}</div>
            </div>
          );
        })}
      </div>
    </Panel>
    <div className="mt-5 flex items-start gap-3 rounded-xl border border-[var(--panel-border)] p-4 text-xs" style={{ color: 'var(--theme-muted)' }}>
      <LockKeyhole className="h-4 w-4 shrink-0" style={{ color: '#b91c1c' }} />
      <span>Chaque changement de privilège doit être attribué à une personne réelle. Les contrôles serveur et les politiques de données ne dépendent pas de cette vue.</span>
    </div>
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
