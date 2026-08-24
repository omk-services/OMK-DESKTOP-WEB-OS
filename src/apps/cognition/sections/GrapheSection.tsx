/**
 * Graphe — manifeste (version, scope, prochaine revision).
 * Extrait de CognitionApp.tsx (section 4 / 5).
 */
import { SectionHead } from '../../../components/AppFrame';
import type { Manifest } from '../../../lib/cognition/queries';
import { Row, formatTimestamp } from './Primitives';

export function GrapheSection({ manifest }: { manifest: Manifest | null }): import('react').ReactNode {
  return (
    <div className="space-y-4">
      <SectionHead
        title="Graphe — manifeste"
        subtitle="Version, perimetre des sources, prochaine revision"
      />
      <section
        className="rounded-2xl border p-5"
        style={{ borderColor: 'var(--panel-border)', background: 'var(--theme-surface)' }}
      >
        {manifest ? (
          <dl className="divide-y" style={{ borderColor: 'var(--panel-border-subtle)' }}>
            <Row label="Version du graphe" value={`v${manifest.graph_version}`} />
            <Row label="Perimetre des sources" value={manifest.source_scope ?? '—'} />
            <Row
              label="Souverainete du savoir"
              value={`${Math.round(manifest.knowledge_sovereignty_score * 100)}%`}
            />
            <Row label="Prochaine revision" value={manifest.next_review_at ? formatTimestamp(manifest.next_review_at) : '—'} />
          </dl>
        ) : (
          <p
            className="text-[12.5px] leading-relaxed"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            Aucun manifeste publie dans <span className="font-mono">cognition.yggdrasil_manifest</span>.
            La SovereignGate reste fermee tant que le graphe n'est pas pose.
          </p>
        )}
      </section>
      <section
        className="rounded-2xl border p-5"
        style={{ borderColor: 'var(--panel-border)', background: 'var(--theme-surface)' }}
      >
        <h2
          className="mb-3 text-[11px] font-bold uppercase tracking-wider"
          style={{ color: 'var(--theme-text-dim)' }}
        >
          Que mesure le score ?
        </h2>
        <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
          Le score de souverainete du savoir agrege : la couverture des sources, la
          fraicheur des routines, la cadence des evenements, et le respect du
          perimetre declare. Sa formule vit dans la spec Yggdrasil — pas dans
          l'UI. Toute montee de score demande une revue manuelle du manifeste.
        </p>
      </section>
    </div>
  );
}
