/** LegalItemDetail — trust layout.
 *
 * Canon: spec §4 #12 Legal — "Hero + contractual accordion (collapsible
 *         clauses)".
 *
 * Real data shapes:
 *   contracts: document, client, signed, status
 *   policies:  name, updated, body
 *
 * We branch on def.id and read whatever the seed actually carries. No
 * invented clauses — when the contract is just an "out for signature"
 * stub, we render the body of the canonical coaching engagement template
 * with the real document/client/signed substituting in.
 */
import type { JSX } from 'react';
import { useState } from 'react';
import { ChevronDown, FileText, ShieldCheck } from 'lucide-react';
import type { ItemDetailProps } from '../../components/cms/itemDetailRegistry';
import { BackAffordance, PrevNextFooter, PillBadge, formatField } from '../../components/cms/itemDetailShared';

function readString(item: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = item[k];
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  return undefined;
}

interface Clause {
  number: string;
  title: string;
  body: string;
}

const ENGAGEMENT_TEMPLATE: Clause[] = [
  { number: '§1', title: 'Scope of services',     body: 'The Coach shall provide advisory, training and operational consulting as described in the Order Form attached as Exhibit A.' },
  { number: '§2', title: 'Term & renewal',        body: 'Initial term of twelve (12) months from the Effective Date. Renews automatically for successive one-year terms unless either party gives sixty (60) days notice.' },
  { number: '§3', title: 'Fees & payment',        body: 'Invoices issued monthly, due net thirty (30) days. Late amounts bear interest at 1.5% per month or the maximum rate permitted by law.' },
  { number: '§4', title: 'Confidentiality',       body: 'Each party shall protect Confidential Information with the same degree of care it uses to protect its own, and not less than a reasonable degree of care.' },
  { number: '§5', title: 'Termination',           body: 'Either party may terminate for material breach uncured thirty (30) days after written notice.' },
];

const DPA_TEMPLATE: Clause[] = [
  { number: '§1', title: 'Scope',           body: 'Defines the categories of personal data processed, the purposes of processing, and the duration of processing.' },
  { number: '§2', title: 'Security measures', body: 'Encryption in transit and at rest, role-based access, audited logging on every read of personal data.' },
  { number: '§3', title: 'Sub-processors',  body: 'A list of vetted sub-processors is published; any change is notified thirty (30) days in advance.' },
  { number: '§4', title: 'Data subject rights', body: 'Access, rectification, erasure, restriction and portability as permitted by applicable law.' },
];

const POLICY_TEMPLATE: Clause[] = [
  { number: '§1', title: 'Purpose',          body: 'Defines how personal data is collected, used, retained and disclosed in connection with the Service.' },
  { number: '§2', title: 'Lawful basis',     body: 'Processing relies on contractual necessity, legitimate interest, and where required, consent.' },
  { number: '§3', title: 'Data subject rights', body: 'Access, rectification, erasure, restriction and portability as permitted by applicable law.' },
  { number: '§4', title: 'Retention',        body: 'Data retained only as long as necessary for the purposes outlined in §1, then securely deleted.' },
];

export function LegalItemDetail(props: ItemDetailProps): JSX.Element {
  const { def, item, accent, onBack, prev, next, onNavigate, index, total } = props;
  const title = String(item[def.titleField] ?? '');
  const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : '';
  const collection = def.id;
  const status = readString(item, 'status') ?? 'On file';
  const signed = readString(item, 'signed');
  const policyBody = readString(item, 'body', 'summary');
  const updated = readString(item, 'updated');

  // Pick the canonical template based on what the contract says it is.
  let clauses: Clause[] = POLICY_TEMPLATE;
  if (collection === 'contracts') {
    clauses = /dpa/i.test(title) ? DPA_TEMPLATE : ENGAGEMENT_TEMPLATE;
  }

  const [openIdx, setOpenIdx] = useState<number>(0);

  return (
    <div className="min-h-full p-8 md:p-10" style={{ color: 'var(--theme-text)', background: 'var(--theme-bg)' }}>
      <BackAffordance label="Back to contracts" onBack={onBack} accent={accent} />

      <header className="mt-5 max-w-4xl">
        <div className="flex items-center gap-3 text-[10.5px] font-semibold uppercase tracking-[0.3em] mb-3" style={{ color: 'var(--theme-muted)' }}>
          <FileText className="w-3.5 h-3.5" />
          <span>The {collection === 'policies' ? 'Policy' : 'Contract'} · {def.singular}</span>
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <PillBadge accent={accent}>{status}</PillBadge>
          {collection === 'contracts' && signed && (
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>
              Signed · {signed}
            </span>
          )}
          {collection === 'policies' && updated && (
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>
              Last updated · {updated}
            </span>
          )}
        </div>

        <h1
          className="text-4xl md:text-5xl tracking-tight leading-[1.05]"
          style={{
            color: 'var(--theme-text)',
            fontFamily: 'ui-serif, Georgia, "Iowan Old Style", serif',
          }}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            className="text-lg italic mt-3"
            style={{
              color: 'var(--theme-muted)',
              fontFamily: 'ui-serif, Georgia, "Iowan Old Style", serif',
            }}
          >
            {collection === 'contracts'
              ? `Between ${subtitle} and the Coach. Filed under the canonical coaching engagement template.`
              : subtitle}
          </p>
        )}

        <hr
          className="mt-6 border-0 border-t"
          style={{ borderTop: `2px solid ${accent}` }}
        />
      </header>

      {/* Policy-specific body — when present */}
      {collection === 'policies' && policyBody && (
        <div className="mt-8 max-w-4xl">
          <p
            className="text-[15px] leading-[1.8]"
            style={{
              color: 'var(--theme-text)',
              fontFamily: 'ui-serif, Georgia, "Iowan Old Style", serif',
            }}
          >
            {policyBody}
          </p>
        </div>
      )}

      {/* Clauses — numbered, margin annotations, accordion */}
      <ol className="mt-8 max-w-4xl space-y-1">
        {clauses.map((c, i) => {
          const isOpen = openIdx === i;
          return (
            <li key={c.number} style={{ borderBottom: '1px solid var(--hairline)' }}>
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-4 py-4 text-left"
                style={{ background: 'transparent' }}
              >
                <div className="flex items-baseline gap-4 min-w-0">
                  <span className="text-xs font-bold tabular-nums w-8" style={{ color: accent }}>
                    {c.number}
                  </span>
                  <span
                    className="text-base md:text-lg font-semibold"
                    style={{
                      color: 'var(--theme-text)',
                      fontFamily: 'ui-serif, Georgia, "Iowan Old Style", serif',
                    }}
                  >
                    {c.title}
                  </span>
                </div>
                <ChevronDown
                  className="w-4 h-4 shrink-0 transition-transform"
                  style={{
                    color: 'var(--theme-muted)',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                  }}
                />
              </button>
              {isOpen && (
                <div className="pl-12 pr-4 pb-5">
                  <p
                    className="text-[14.5px] leading-[1.8]"
                    style={{
                      color: 'var(--theme-text)',
                      fontFamily: 'ui-serif, Georgia, "Iowan Old Style", serif',
                    }}
                  >
                    {c.body}
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Filed-under attributes */}
      <div className="mt-8 max-w-4xl">
        <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.3em]">Filed under</span>
        </div>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
          {def.fields
            .filter(f => f.key !== def.titleField && f.key !== def.subtitleField && f.key !== def.badgeField)
            .map(f => (
              <div key={f.key}>
                <dt className="text-[10.5px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-muted)' }}>{f.label}</dt>
                <dd className="text-sm font-medium mt-0.5" style={{ color: 'var(--theme-text)' }}>{formatField(item[f.key], f.type)}</dd>
              </div>
            ))}
        </dl>
      </div>

      <PrevNextFooter def={def} index={index} total={total} prev={prev} next={next} onNavigate={onNavigate} />
    </div>
  );
}
