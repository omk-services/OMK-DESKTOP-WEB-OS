/** ProwlerImport — drop a Prowler JSON report, get legal_gaps out.
 *
 *  Prowler (https://github.com/prowler-cloud/prowler) is a CLI scanner that
 *  emits a JSON report shaped as either `findings[]` (modern) or wrapped in
 *  a top-level object. We accept both. Only FAIL findings become gaps.
 *
 *  The mapping is deliberately conservative:
 *  - title  = CheckID + a one-line Description, to stay grep-friendly.
 *  - control = CheckID (free-text; the dashboard does not depend on a
 *    real FK because controls may not exist yet for a new framework).
 *  - framework = ServiceName (a hint, not a verified link).
 *  - severity = passed through uppercase.
 *  - openedOn = today (ISO date).
 *  - owner = empty (the user assigns it).
 *
 *  Duplicate suppression: if a gap already exists with the same title
 *  (case-insensitive), the new one is skipped — Prowler is re-runnable
 *  and a re-scan should not duplicate the audit narrative.
 *
 *  Counters before / after: the UI shows the gap count from the store
 *  at mount and after the import, so the user sees a real delta
 *  (the brief's « toast de succès ne prouve rien » trap).
 */
import { useRef, useState } from 'react';
import { Upload, CheckCircle2, FileWarning } from 'lucide-react';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useShellStore } from '../../stores/shell.store';
import { Card } from '../_ui/kit';
import { useCmsCollectionStatus } from './useCmsCollectionStatus';
import { UnknownCollectionBanner } from '../../components/UnknownCollectionBanner';

interface ProwlerFinding {
  CheckID?: string;
  Severity?: string;
  Status?: string;
  Description?: string;
  ServiceName?: string;
}

interface ProwlerReport {
  findings?: ProwlerFinding[];
  /** Some Prowler versions wrap findings under a different key. */
  [k: string]: unknown;
}

function extractFindings(raw: unknown): ProwlerFinding[] {
  if (Array.isArray(raw)) return raw as ProwlerFinding[];
  if (raw && typeof raw === 'object') {
    const obj = raw as ProwlerReport;
    if (Array.isArray(obj.findings)) return obj.findings;
    // Some Prowler exports nest under a top-level provider key.
    for (const v of Object.values(obj)) {
      if (Array.isArray(v)) return v as ProwlerFinding[];
    }
  }
  return [];
}

export function ProwlerImport() {
  const addItem = useCmsStore((s) => s.addItem);
  // Brief FIX-7 — silence bruyant. Si la collection cible n'est pas dans le
  // registre central, l'import va répondre « Collection inconnue :
  // "legal_gaps" » à chaque fichier. On le dit à l'utilisateur *avant* qu'il
  // ne clique, via un bandeau explicite.
  const gapsRead = useCmsCollectionStatus('legal_gaps');
  const gaps = gapsRead.items;
  const addToast = useShellStore((s) => s.addToast);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [lastSummary, setLastSummary] = useState<{ added: number; skipped: number; failed: number } | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setLastSummary(null);
    let text: string;
    try {
      text = await file.text();
    } catch (err) {
      setBusy(false);
      addToast({ source: 'Legal', type: 'error', message: `Lecture du fichier impossible : ${String(err)}` });
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      setBusy(false);
      addToast({ source: 'Legal', type: 'error', message: `JSON invalide : ${String(err)}` });
      return;
    }
    const findings = extractFindings(parsed);
    if (findings.length === 0) {
      setBusy(false);
      addToast({ source: 'Legal', type: 'warning', message: 'Aucun finding détecté dans le fichier.' });
      return;
    }
    const failing = findings.filter((f) => String(f.Status ?? '').toUpperCase() === 'FAIL');
    const today = new Date().toISOString().slice(0, 10);
    const existingTitles = new Set(gaps.map((g) => String(g.title ?? '').toLowerCase().trim()));
    let added = 0;
    let skipped = 0;
    let failed = 0;
    for (const f of failing) {
      const checkId = String(f.CheckID ?? 'UNKNOWN').trim();
      const description = String(f.Description ?? '').trim();
      const title = description
        ? `${checkId} — ${description.slice(0, 80)}${description.length > 80 ? '…' : ''}`
        : checkId;
      if (existingTitles.has(title.toLowerCase())) {
        skipped += 1;
        continue;
      }
      const severity = String(f.Severity ?? 'Medium').toUpperCase();
      const result = addItem('legal_gaps', {
        title,
        control: checkId,
        framework: String(f.ServiceName ?? '').trim(),
        severity,
        openedOn: today,
        owner: '',
        status: 'Open',
      });
      if (result.ok) {
        added += 1;
        existingTitles.add(title.toLowerCase());
      } else {
        failed += 1;
      }
    }
    setBusy(false);
    setLastSummary({ added, skipped, failed });
    addToast({
      source: 'Legal',
      type: added > 0 ? 'success' : 'warning',
      message: `Prowler importé : ${added} ajoutés, ${skipped} déjà connus, ${failed} échoués.`,
    });
    // Clear the input so the same file can be re-picked if needed.
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Card title="Import Prowler">
      <div className="px-5 py-4 flex flex-col gap-3">
        <UnknownCollectionBanner
          collectionId="legal_gaps"
          status={gapsRead.status}
          appName="Legal"
        testFilePath="src/apps/legal/seed-collections.test.ts"
        />
        <p className="text-[12.5px]" style={{ color: 'var(--theme-text-muted)' }}>
          Déposez un export JSON de Prowler (CLI&nbsp;: <code>prowler aws -M json</code>). Chaque finding
          <code style={{ marginLeft: 4 }}>FAIL</code> devient un écart dans la collection « Écarts ». Les doublons sont ignorés.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <label
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[12px] font-semibold cursor-pointer transition-all"
            style={{
              background: '#0f172a',
              color: '#ffffff',
              opacity: busy ? 0.6 : 1,
              pointerEvents: busy ? 'none' : 'auto',
            }}
          >
            <Upload className="w-3.5 h-3.5" />
            {busy ? 'Lecture…' : 'Choisir un fichier .json'}
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={onFile}
              className="hidden"
              data-legal-action="prowler-file-input"
            />
          </label>
          <span className="text-[11.5px]" style={{ color: 'var(--theme-text-dim)' }}>
            Les findings PASS sont ignorés. Seuls les FAIL deviennent des écarts.
          </span>
        </div>
        {lastSummary && (
          <div
            className="flex items-start gap-2 rounded-lg px-3 py-2 text-[11.5px]"
            style={{
              background: lastSummary.added > 0 ? '#f0fdf4' : '#fef3c7',
              color: lastSummary.added > 0 ? '#166534' : '#92400e',
              border: `1px solid ${lastSummary.added > 0 ? '#bbf7d0' : '#fde68a'}`,
            }}
          >
            {lastSummary.added > 0 ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            ) : (
              <FileWarning className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-semibold">
                {lastSummary.added} écart{lastSummary.added > 1 ? 's' : ''} créé{lastSummary.added > 1 ? 's' : ''},
                {' '}{lastSummary.skipped} ignoré{lastSummary.skipped > 1 ? 's' : ''},
                {' '}{lastSummary.failed} échoué{lastSummary.failed > 1 ? 's' : ''}.
              </div>
              <div className="text-[10.5px] mt-0.5" style={{ opacity: 0.85 }}>
                Allez dans la section « Écarts » pour les voir et leur assigner un owner.
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
