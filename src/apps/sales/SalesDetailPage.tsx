/**
 * SalesDetailPage — Sales-specific detail meta (kind → icon/accent/action).
 *
 * Phase 48 refactor: render body delegated to canonical <DetailPage>.
 * This file now exports only the DETAIL_META map + types; the actual page
 * rendering lives in src/components/DetailPage.tsx.
 *
 * D4 append-only: Sales app keeps its own kind→meta table (sales-specific),
 * but the page layout is now shared with People/IT-RD/Finance/Operations.
 *
 * Cause D — chaînage deal Won : on a ajouté un panneau "Mark Paid · Create
 * invoice + client" sous le DetailPage quand le deal est au stade Won.
 * Avant, la fiche deal ne déclenchait rien — le bouton « Mark Paid »
 * vivait seulement dans la fiche drill (SalesItemDetail). Cette page
 * couvre l'autre entrée (kanban → setDetail({kind:'deal', ...})).
 */

import {
  BriefcaseBusiness,
  CalendarClock,
  CheckSquare,
  BookOpen,
  RotateCw,
  Cpu,
  FileSignature,
} from 'lucide-react';
import { DetailPage, type DetailItemBase, type DetailMeta } from '../../components/DetailPage';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useShellStore } from '../../stores/shell.store';

export type DetailKind = 'deal' | 'call' | 'task' | 'doc' | 'routine' | 'tool';

interface DealDetail   extends DetailItemBase { kind: 'deal' }
interface CallDetail   extends DetailItemBase { kind: 'call' }
interface TaskDetail   extends DetailItemBase { kind: 'task' }
interface DocDetail    extends DetailItemBase { kind: 'doc' }
interface RoutineDetail extends DetailItemBase { kind: 'routine' }
interface ToolDetail   extends DetailItemBase { kind: 'tool' }

export type DetailItem =
  | DealDetail
  | CallDetail
  | TaskDetail
  | DocDetail
  | RoutineDetail
  | ToolDetail;

const SALES_DETAIL_META: Record<DetailKind, DetailMeta> = {
  deal: { label: 'Deal workspace', icon: BriefcaseBusiness, accent: '#ea580c' },
  call: {
    label: 'Call intelligence',
    icon: CalendarClock,
    accent: '#2563eb',
  },
  task: {
    label: 'Execution task',
    icon: CheckSquare,
    accent: '#0d9488',
    action: { label: 'Open in Tasks', appId: 'tasks' },
  },
  doc: {
    label: 'Context document',
    icon: BookOpen,
    accent: '#7c3aed',
    action: { label: 'Return to Context', appId: 'sales' },
  },
  routine: { label: 'Cognition routine', icon: RotateCw, accent: '#c2410c' },
  tool: {
    label: 'Stack connector',
    icon: Cpu,
    accent: '#475569',
    action: { label: 'Open connector settings', appId: 'settings' },
  },
};

interface SalesDetailPageProps {
  item: DetailItem;
  onBack: () => void;
  onNavigate?: (appId: string) => void;
}

/** Read the deal amount from the kanban-built detail. The kanban passes
 *  the fields explicitly (Offer, Value, Stage) so the dollar number is
 *  recoverable without a re-fetch from the CMS store. */
function readAmount(item: DetailItemBase): number | undefined {
  const valueField = item.fields.find((f) => f.label === 'Value');
  if (!valueField) return undefined;
  const raw = valueField.value.replace(/[^\d.]/g, '');
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function SalesDetailPage({ item, onBack, onNavigate }: SalesDetailPageProps) {
  const addItem = useCmsStore((s) => s.addItem);
  const clientsItems = useCmsStore((s) => s.items['clients']) ?? [];
  const addToast = useShellStore((s) => s.addToast);

  const isWonDeal = item.kind === 'deal' && /won/i.test(item.status);
  const onMarkPaidWon = (): void => {
    if (item.kind !== 'deal') return;
    const amount = readAmount(item);
    if (amount === undefined) {
      addToast({ source: 'Sales', type: 'warning', message: 'Deal value is missing — cannot invoice.' });
      return;
    }
    const now = new Date();
    const due = new Date(now.getTime() + 30 * 86400_000);
    const isoMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const clientName = (item.title || '').trim() || 'Client';
    const existingClient = clientsItems.find((c) => String(c.name ?? '').trim().toLowerCase() === clientName.toLowerCase());
    if (!existingClient) {
      const clientResult = addItem('clients', {
        name: clientName,
        segment: 'Citadelle — high ticket',
        ticket: amount,
        openThreads: 0,
        nextSession: 'Not scheduled',
        health: 100,
        onboardingStep: '1 / 7',
        status: 'Onboarding',
      });
      if (clientResult.ok) {
        addToast({ source: 'Sales', type: 'success', message: `Client « ${clientName} » créé.` });
      } else {
        addToast({ source: 'Sales', type: 'warning', message: `Client non créé : ${clientResult.error ?? 'erreur inconnue'}.` });
      }
    }
    const invoiceResult = addItem('invoices', {
      client: clientName,
      number: `INV-${isoMonth}-${String(item.id).slice(-4)}`,
      amount,
      status: 'Sent',
      due: due.toISOString().slice(0, 10),
      issued: now.toISOString().slice(0, 10),
      description: `Invoice line · deal ${item.id}`,
    });
    if (invoiceResult.ok) {
      addToast({
        source: 'Sales',
        type: 'success',
        message: `Facture créée pour ${clientName} ($${amount.toLocaleString('en-US')}).`,
      });
    } else {
      addToast({ source: 'Sales', type: 'warning', message: `Facture non créée : ${invoiceResult.error ?? 'erreur inconnue'}.` });
    }
  };

  return (
    <>
      <DetailPage
        item={item}
        backLabel="Back to Sales OS"
        onBack={onBack}
        onNavigate={onNavigate}
        meta={SALES_DETAIL_META[item.kind]}
      />
      {isWonDeal ? (
        <div className="border-t border-[var(--panel-border)] bg-[var(--theme-surface)] px-6 py-5">
          <button
            type="button"
            onClick={onMarkPaidWon}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:brightness-95 active:scale-[0.99]"
            style={{ background: SALES_DETAIL_META.deal.accent }}
            aria-label="Mark Paid · Create invoice + client"
          >
            <FileSignature className="h-4 w-4" />
            Mark Paid · Create invoice + client
          </button>
          <p className="mt-2 text-[11px] text-[var(--theme-text-dim)] text-center">
            Crée le client (s'il n'existe pas) puis une facture miroir du deal, due à +30 jours.
          </p>
        </div>
      ) : null}
    </>
  );
}
