/**
 * SalesDetailPage — Sales-specific detail meta (kind → icon/accent/action).
 *
 * Phase 48 refactor: render body delegated to canonical <DetailPage>.
 * This file now exports only the DETAIL_META map + types; the actual page
 * rendering lives in src/components/DetailPage.tsx.
 *
 * D4 append-only: Sales app keeps its own kind→meta table (sales-specific),
 * but the page layout is now shared with People/IT-RD/Finance/Operations.
 */

import {
  BriefcaseBusiness,
  CalendarClock,
  CheckSquare,
  BookOpen,
  RotateCw,
  Cpu,
} from 'lucide-react';
import { DetailPage, type DetailItemBase, type DetailMeta } from '../../components/DetailPage';

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

export function SalesDetailPage({ item, onBack, onNavigate }: SalesDetailPageProps) {
  return (
    <DetailPage
      item={item}
      backLabel="Back to Sales OS"
      onBack={onBack}
      onNavigate={onNavigate}
      meta={SALES_DETAIL_META[item.kind]}
    />
  );
}
