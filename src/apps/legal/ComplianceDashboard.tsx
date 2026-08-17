/** ComplianceDashboard — the at-a-glance view of the legal app.
 *
 *  Reads the 7 CMS collections, derives the metrics a non-technical
 *  user actually needs:
 *
 *  - Score by framework (controls `done` / total controls of that framework)
 *  - Open gaps, broken down by severity
 *  - Evidence expiring within 30 days
 *  - Policies to review within 60 days
 *  - Vendors with no DPA but with data access
 *
 *  The point is to make the page readable as a dashboard, not as a
 *  report: a `StatCard` per metric, a `ScoreBar` per framework, and a
 *  call-out to the live CMS repeater for drill-down.
 *
 *  Theme rules: theme-var colors only. No hardcoded neutrals. No
 *  Tailwind palette classes. Trust accent (#0f172a) where meaning
 *  demands it (the score bar fill on the "current" tier).
 */
import { Card, StatCard, Badge } from '../_ui/kit';
import { ProgressRow } from '../_ui/widgets';
import { AlertTriangle, ShieldAlert, FileWarning, CalendarClock, ShieldOff, FileText } from 'lucide-react';
import { useCmsCollectionStatus } from './useCmsCollectionStatus';
import { UnknownCollectionBanner } from './UnknownCollectionBanner';

const APP_ACCENT = '#0f172a';

const DAY_MS = 86_400_000;

function daysUntil(iso: string | undefined): number | null {
  if (!iso || iso === '—') return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((t - Date.now()) / DAY_MS);
}

/** Compute the score (0..100) of a given framework: `done` controls
 *  over total controls, with the controls linked to that framework
 *  by their free-text `framework` field. Coarse but legible. */
function frameworkScore(
  frameworks: { id: string; [k: string]: unknown }[],
  controls: { id: string; [k: string]: unknown }[],
): { name: string; total: number; done: number; pct: number }[] {
  return frameworks.map((fw) => {
    const name = String(fw.name ?? '');
    const fwControls = controls.filter((c) => String(c.framework ?? '') === name);
    const total = fwControls.length;
    const done = fwControls.filter((c) => String(c.status ?? '').toLowerCase() === 'done').length;
    const pct = total === 0 ? 0 : Math.round((done * 100) / total);
    return { name, total, done, pct };
  });
}

export function ComplianceDashboard() {
  // Brief FIX-7 — silence bruyant. Chacune des sept collections consommées
  // est lue avec son discriminant (`status: 'registered' | 'unknown'`), et
  // passe par un bandeau explicite quand le registre central ne la porte
  // pas. Sans ce geste, un seed qui oublie `legal_vendors` (par exemple)
  // afficherait « Fournisseurs sans DPA : 0 » sans rien dire du registre.
  const frameworksRead = useCmsCollectionStatus('legal_frameworks');
  const controlsRead = useCmsCollectionStatus('legal_controls');
  const compliancePoliciesRead = useCmsCollectionStatus('legal_compliance_policies');
  const evidenceRead = useCmsCollectionStatus('legal_evidence');
  const risksRead = useCmsCollectionStatus('legal_risks');
  const vendorsRead = useCmsCollectionStatus('legal_vendors');
  const gapsRead = useCmsCollectionStatus('legal_gaps');
  const frameworks = frameworksRead.items;
  const controls = controlsRead.items;
  const compliancePolicies = compliancePoliciesRead.items;
  const evidence = evidenceRead.items;
  const risks = risksRead.items;
  const vendors = vendorsRead.items;
  const gaps = gapsRead.items;

  // Collection IDs consomme par le dashboard (utilisees pour le bandeau
  // d'erreur de chaque section ci-dessous). Gardees en memoire pour qu'un
  // ajout futur de collection saute aux yeux dans la liste des bandeaux.
  const readByCollection = {
    legal_frameworks: frameworksRead,
    legal_controls: controlsRead,
    legal_compliance_policies: compliancePoliciesRead,
    legal_evidence: evidenceRead,
    legal_risks: risksRead,
    legal_vendors: vendorsRead,
    legal_gaps: gapsRead,
  } as const;

  const scores = frameworkScore(frameworks, controls);
  const totalControls = controls.length;
  const doneControls = controls.filter((c) => String(c.status).toLowerCase() === 'done').length;
  const globalPct = totalControls === 0 ? 0 : Math.round((doneControls * 100) / totalControls);

  const openGaps = gaps.filter((g) => String(g.status).toLowerCase() !== 'closed');
  const criticalGaps = openGaps.filter((g) => /high|critical/i.test(String(g.severity)));

  const expiringEvidence = evidence
    .map((e) => ({ e, days: daysUntil(String(e.expiresAt ?? '')) }))
    .filter((x): x is { e: typeof evidence[number]; days: number } => x.days !== null && x.days <= 30 && x.days >= -365);

  const policiesToReview = compliancePolicies
    .map((p) => ({ p, days: daysUntil(String(p.reviewBy ?? '')) }))
    .filter((x): x is { p: typeof compliancePolicies[number]; days: number } => x.days !== null && x.days <= 60);

  const vendorsWithoutDpa = vendors.filter((v) => {
    const access = String(v.dataAccess ?? '').toLowerCase();
    const dpa = String(v.dpaSigned ?? '').toLowerCase();
    return access !== 'none' && access !== 'no' && dpa !== 'yes';
  });

  const openHighRisks = risks.filter((r) => {
    const rating = String(r.rating ?? '').toLowerCase();
    const status = String(r.status ?? '').toLowerCase();
    return /high|critical/.test(rating) && status !== 'mitigated' && status !== 'closed';
  });

  return (
    <div className="p-7 flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight font-outfit" style={{ color: 'var(--theme-text)' }}>
            Conformité — vue d'ensemble
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            Les chiffres viennent directement des collections ci-dessous. Chaque métrique ouvre la section correspondante.
          </p>
        </div>
        <Badge tone={globalPct >= 80 ? 'ok' : globalPct >= 50 ? 'warn' : 'danger'}>
          {doneControls} / {totalControls}
        </Badge>
      </div>

      {/*
       * Brief FIX-7 — silence bruyant. On affiche un bandeau par collection
       * consommée qui n'a pas été déclarée dans le registre central. L'ordre
       * suit l'apparition des collections dans le dashboard (de haut en bas),
       * pour qu'un humain qui regarde l'écran sache tout de suite quelle
       * métrique est menteuse.
       */}
      <div className="flex flex-col gap-2">
        {Object.entries(readByCollection).map(([id, read]) => (
          <UnknownCollectionBanner
            key={id}
            collectionId={id}
            status={read.status}
            appName="Legal"
          />
        ))}
      </div>

      {/* Top row — at a glance */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Score global"
          value={`${globalPct}%`}
          hint={`${doneControls} / ${totalControls} contrôles OK`}
          tone={globalPct >= 80 ? 'ok' : globalPct >= 50 ? 'warn' : 'danger'}
          accent={APP_ACCENT}
          icon={ShieldAlert}
        />
        <StatCard
          label="Écarts ouverts"
          value={openGaps.length}
          hint={criticalGaps.length > 0 ? `${criticalGaps.length} critiques` : 'Aucun critique'}
          tone={openGaps.length === 0 ? 'ok' : criticalGaps.length > 0 ? 'danger' : 'warn'}
          accent="#dc2626"
          icon={AlertTriangle}
        />
        <StatCard
          label="Preuves qui expirent"
          value={expiringEvidence.length}
          hint={expiringEvidence.length === 0 ? 'Aucune dans 30 j' : 'À renouveler'}
          tone={expiringEvidence.length === 0 ? 'ok' : 'warn'}
          accent="#b45309"
          icon={FileWarning}
        />
        <StatCard
          label="Politiques à rerelire"
          value={policiesToReview.length}
          hint="Fenêtre 60 jours"
          tone={policiesToReview.length === 0 ? 'ok' : 'warn'}
          accent="#7c3aed"
          icon={CalendarClock}
        />
        <StatCard
          label="Fournisseurs sans DPA"
          value={vendorsWithoutDpa.length}
          hint="Accès données + DPA manquant"
          tone={vendorsWithoutDpa.length === 0 ? 'ok' : 'danger'}
          accent="#0891b2"
          icon={ShieldOff}
        />
        <StatCard
          label="Risques hauts ouverts"
          value={openHighRisks.length}
          hint="Non mitigés"
          tone={openHighRisks.length === 0 ? 'ok' : 'danger'}
          accent="#b91c1c"
          icon={FileText}
        />
      </div>

      {/* Frameworks breakdown */}
      <Card title="Score par cadre">
        <div className="px-5 py-4 flex flex-col gap-3">
          {scores.length === 0 && (
            <div className="text-[12px]" style={{ color: 'var(--theme-text-dim)' }}>
              Aucun cadre enregistré. Allez dans la section « Cadres » pour en ajouter.
            </div>
          )}
          {scores.map((s) => (
            <ProgressRow
              key={s.name}
              label={s.name}
              value={s.pct}
              hint={`${s.done} / ${s.total} contrôles`}
              accent={s.pct >= 80 ? '#16a34a' : s.pct >= 50 ? '#d97706' : '#dc2626'}
            />
          ))}
        </div>
      </Card>

      {/* Quick links to repeaters — surface the live data without forcing navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {criticalGaps.length > 0 && (
          <Card title="Derniers écarts critiques">
            <ul className="px-5 py-3 flex flex-col gap-2 text-[12.5px]">
              {criticalGaps.slice(0, 4).map((g) => (
                <li key={String(g.id)} className="flex items-start gap-2">
                  <span
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full mt-0.5 shrink-0"
                    style={{ background: '#dc2626', color: '#fff', fontSize: 9, fontWeight: 700 }}
                  >
                    !
                  </span>
                  <span style={{ color: 'var(--theme-text)' }}>
                    {String(g.title)}
                    <span className="ml-1.5 text-[10.5px] font-mono" style={{ color: 'var(--theme-text-dim)' }}>
                      {String(g.control)} · {String(g.framework)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
        {expiringEvidence.length > 0 && (
          <Card title="Preuves à renouveler">
            <ul className="px-5 py-3 flex flex-col gap-2 text-[12.5px]">
              {expiringEvidence.slice(0, 4).map(({ e, days }) => (
                <li key={String(e.id)} className="flex items-start gap-2">
                  <span
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full mt-0.5 shrink-0"
                    style={{ background: days < 0 ? '#dc2626' : '#b45309', color: '#fff', fontSize: 9, fontWeight: 700 }}
                  >
                    {days < 0 ? '−' : '⏱'}
                  </span>
                  <span style={{ color: 'var(--theme-text)' }}>
                    {String(e.title)}
                    <span className="ml-1.5 text-[10.5px] font-mono" style={{ color: 'var(--theme-text-dim)' }}>
                      {days < 0 ? `expirée depuis ${-days} j` : `expire dans ${days} j`}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
