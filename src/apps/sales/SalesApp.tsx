/**
 * SalesApp — Sales OS Control Center (editorial).
 *
 * Brief N (2026-08-11) — la couche Cognition a quitte Sales. Sales expose
 * un seul indicateur (carte dans la sidebar "Cognition" avec un lien vers
 * l'appautonome via `coach-os:open-app-section`). Plus de hook de donnees,
 * plus de gestion d'etat/chargement/erreur pour Cognition dans cette app.
 *
 *  - Les onglets sont rendus cote a cote, jamais dans AppFrame (heritage
 *    du theme de l'app). Les pages de detail passent par
 *    AppDetailOverlay monte en frere d'AppFrame (pattern canonique de
 *    clients) — voir src/components/cms/AppDetailOverlay.tsx.
 *  - Toutes les couleurs sont tirees des variables --theme-*. Les seules
 *    couleurs semantiques autorisees : orange d'accent (l'app), vert
 *    (gagne / ICP fit), rouge (perdu / a relancer), et les statuts
 *    fondateurs (ok / warn / danger / accent) qui passent par des
 *    melanges de variables de theme.
 *  - L'app conserve ses donnees seedees (calls, deals, tasks, docs,
 *    skills, routines, stack) — pas de nouvelles dependances, pas
 *    de nouveau registre, pas de modification des autres apps.
 *
 *  Les 6 sections (Today, Pipeline, Kanban, Context, Capabilities, Stack)
 *  vivent chacune dans src/apps/sales/sections/, plus Primitives.tsx pour
 *  l'accent, les couleurs semantiques, la typographie et les types/
 *  interfaces du domaine partages entre panels.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen, ClipboardList, Cpu, Handshake, Sparkles, Sun, TrendingUp,
} from 'lucide-react';
import { AppFrame, type AppSection } from '../../components/AppFrame';
import { AppDetailOverlay } from '../../components/cms/AppDetailOverlay';
import { useShellStore } from '../../stores/shell.store';
import { useWindowPage } from '../../contexts/WindowContext';
import { SalesDetailPage, type DetailItem } from './SalesDetailPage';
import { registerItemDetail } from '../../components/cms/itemDetailRegistry';
import { SalesItemDetail } from './SalesItemDetail';
import { seedSalesCms } from './seed';
import { ACCENT } from './sections/Primitives';
import { TodayPanel } from './sections/TodayPanel';
import { PipelinePanel } from './sections/PipelinePanel';
import { KanbanPanel } from './sections/KanbanPanel';
import { ContextPanel } from './sections/ContextPanel';
import { CapabilitiesPanel } from './sections/CapabilitiesPanel';
import { StackPanel } from './sections/StackPanel';

registerItemDetail('sales', SalesItemDetail);
seedSalesCms();

const SALES_TITLE = 'Sales OS';
const SALES_SUBTITLE = 'Control Center';

export function SalesApp() {
  const openApp = useShellStore((state) => state.openApp);
  const [detail, setDetail] = useState<DetailItem | null>(null);
  const { setDetail: setWindowDetail } = useWindowPage();

  // Le ton creme de l'app vient de CANONICAL_APP_THEMES dans lib/themes/tokens.ts,
  // pas d'ici. Une version precedente appelait `setAppTheme('sales', ...)` a
  // chaque montage : cela ecrasait le choix de l'utilisateur dans Settings et
  // annulait en silence la surcharge de theme par app. `resolveTheme` lit
  // `appThemes[appId] ?? CANONICAL_APP_THEMES[appId] ?? globalTheme` — le defaut
  // canonique donne donc le meme rendu tout en laissant le choix explicite gagner.

  const navigate = (appId: string): void => {
    if (appId === 'tasks') openApp('tasks', 'Tasks');
    if (appId === 'settings') openApp('settings', 'Settings');
    if (appId === 'sales') openApp('sales', SALES_TITLE);
    setDetail(null);
  };

  /** Section-to-section nav inside Sales. The AppFrame listens to
   *  `coach-os:open-app-section` (DOM custom event, see AppFrame.tsx) and
   *  switches activeId when the requested sectionId matches. Dispatching
   *  with no appId bypasses the cross-app filter — the single AppFrame
   *  mounted in this window always handles it. */
  const navigateToSection = (sectionId: string): void => {
    window.dispatchEvent(new CustomEvent('coach-os:open-app-section', {
      detail: { sectionId },
    }));
    setDetail(null);
  };

  // Brief N (2026-08-11) — Sales garde un seul indicateur de Cognition : une
  // carte dans la section Pipeline qui ouvre l'app Cognition via l'evenement
  // `coach-os:open-app-section` (le seul a avoir un ecouteur, voir SOCLE.md).
  const openCognition = (): void => {
    openApp('cognition', 'Cognition');
    setDetail(null);
  };

  useEffect(() => {
    if (detail) {
      setWindowDetail({ label: detail.title, onBack: () => setDetail(null) });
    } else {
      setWindowDetail(null);
    }
  }, [detail, setWindowDetail]);

  const sections: AppSection[] = useMemo(() => [
    { id: 'today', label: 'Today', icon: Sun, render: () => <TodayPanel onSelect={setDetail} /> },
    { id: 'pipeline', label: 'Pipeline', icon: TrendingUp, render: () => <PipelinePanel onSelect={setDetail} navigateToSection={navigateToSection} onOpenCognition={openCognition} /> },
    { id: 'kanban', label: 'Kanban', icon: ClipboardList, render: () => <KanbanPanel onSelect={setDetail} /> },
    { id: 'context', label: 'Context', icon: BookOpen, render: () => <ContextPanel onSelect={setDetail} navigateToSection={navigateToSection} /> },
    { id: 'capabilities', label: 'Capabilities', icon: Sparkles, render: () => <CapabilitiesPanel onSelect={setDetail} navigateToSection={navigateToSection} /> },
    { id: 'stack', label: 'Stack', icon: Cpu, render: () => <StackPanel onSelect={setDetail} navigateToSection={navigateToSection} /> },
  ], []);

  return (
    <div className="relative h-full">
      <AppFrame
        title={SALES_TITLE}
        subtitle={SALES_SUBTITLE}
        accent={ACCENT}
        icon={Handshake}
        sections={sections}
      />
      {detail ? (
        <AppDetailOverlay
          appId="sales"
          accent={ACCENT}
          onBack={() => setDetail(null)}
          motion={{ kind: 'slide-right', durationMs: 200 }}
        >
          <SalesDetailPage item={detail} onBack={() => setDetail(null)} onNavigate={navigate} />
        </AppDetailOverlay>
      ) : null}
    </div>
  );
}
