/** App discovery — central registration of every Coach OS app.
 *  Registration order = desktop-icon order (OMK Business OS sidebar grouping). */
import type { ReactNode } from 'react';
import { LayoutDashboard, UserCog, ClipboardList, Cpu, Contact, CheckSquare, Store, Boxes, Sprout, Handshake, Wallet, Scale, Settings, Compass, Shield, Wand2, Network, BrainCircuit } from 'lucide-react';
import { registerApp } from './app-registry';
import { seedCms } from './cms/seed';

seedCms();

import { DashboardApp } from '../apps/dashboard/DashboardApp';
import { PeopleApp } from '../apps/people/PeopleApp';
import { OperationsApp } from '../apps/operations/OperationsApp';
import { ItRdApp } from '../apps/it-rd/ItRdApp';
import { ClientsApp } from '../apps/clients/ClientsApp';
import { TasksApp } from '../apps/tasks/TasksApp';
import { MarketplaceApp } from '../apps/marketplace/MarketplaceApp';
import { ProductApp } from '../apps/product/ProductApp';
import { GrowthApp } from '../apps/growth/GrowthApp';
import { SalesApp } from '../apps/sales/SalesApp';
import { FinanceApp } from '../apps/finance/FinanceApp';
import { LegalApp } from '../apps/legal/LegalApp';
import { SettingsApp } from '../apps/settings/SettingsApp';
import { WelcomeApp } from '../apps/welcome/WelcomeApp';
import { AuditApp } from '../apps/audit/AuditApp';
import { DesignApp } from '../apps/design/DesignApp';
import { OntologyApp } from '../apps/ontology/OntologyApp';

registerApp({ id: 'dashboard',   name: 'Dashboard',            icon: LayoutDashboard, accent: '#059669', description: 'Ecosystem Vitals — the home view',              component: DashboardApp });
registerApp({ id: 'people',      name: 'People / Agents',      icon: UserCog,         accent: '#0891b2', description: 'Your team and the agents on the People domain',  component: PeopleApp });
registerApp({ id: 'operations',  name: 'Operations',           icon: ClipboardList,   accent: '#4f46e5', description: 'Runbooks, knowledge base, incidents',            component: OperationsApp });
registerApp({ id: 'it-rd',       name: 'IT / R&D',             icon: Cpu,             accent: '#7c3aed', description: 'Kernel status, experiments, deploys',            component: ItRdApp });
registerApp({ id: 'clients',     name: 'Clients',              icon: Contact,         accent: '#2563eb', description: 'Accounts, onboarding and churn risk',            component: ClientsApp });
registerApp({ id: 'tasks',       name: 'Tasks',                icon: CheckSquare,     accent: '#0d9488', description: 'What needs you today',                           component: TasksApp });
registerApp({ id: 'marketplace', name: 'Marketplace',          icon: Store,           accent: '#db2777', description: 'Sandboxed integrations',                         component: MarketplaceApp });
registerApp({ id: 'product',     name: 'Product',              icon: Boxes,           accent: '#9333ea', description: 'Roadmap, backlog, releases',                     component: ProductApp });
registerApp({ id: 'growth',      name: 'Growth',               icon: Sprout,          accent: '#16a34a', description: 'Funnel, channels, experiments',                  component: GrowthApp });
registerApp({ id: 'sales',       name: 'Sales OS',             icon: Handshake,       accent: '#ea580c', description: 'Pipeline, deals, forecast',                      component: SalesApp });
// Audit Diagnostic IA (Drawbridge Task 4 2026-07-28: extrait from C:\Users\amado\Downloads\audit.pdf).
// Brief M (2026-08-11) — refonte de l'app : le diagnostic guidé a remplacé
// le quiz commercial. L'app reste la même (id `audit`), seule l'app
// `onboarding` (citadel) a été retirée. Une migration localStorage silencieuse
// ramène les fenêtres `onboarding` vers `audit` à la lecture.
registerApp({ id: 'audit',       name: 'Audit',                  icon: Shield,          accent: '#b91c1c', description: 'Diagnostic IA guidé · 6 grilles · verdict argumenté', component: AuditApp });
registerApp({ id: 'finance',     name: 'Finance',              icon: Wallet,          accent: '#ca8a04', description: 'Unit economics, runway, invoices',               component: FinanceApp });
registerApp({ id: 'legal',       name: 'Legal',                icon: Scale,           accent: '#64748b', description: 'Contracts and AI-Act compliance',                component: LegalApp });
registerApp({ id: 'settings',    name: 'Settings',             icon: Settings,        accent: '#78716c', description: 'General, privacy, integrations',                 component: SettingsApp });
// Welcome — Circle.so-style landing pages, one per business domain. Sidebar
// lists pages; canvas renders each as a one-page experience with sticky
// header-menu in-page navigation.
registerApp({ id: 'welcome',     name: 'Welcome',               icon: Compass,         accent: '#4f46e5', description: 'Landing pages · Circle.so style',              component: WelcomeApp,   dockSlot: 1 });
// Design — Six-Front-end showcase (drawbridge task #8 2026-07-30): pure-presentation
// canvas that re-skins per sidebar style (Glassmorphism, Claymorphism, Brutalism,
// Cyberpunk, Soft UI / Neumorphism, Editorial). No Supabase, no cognition hydration.
registerApp({ id: 'design',      name: 'Design',                icon: Wand2,           accent: '#0f172a', description: 'Twenty front-end styles · one showcase canvas', component: DesignApp   });
// Ontology — story 2 de l'epic couche-ontologie : lecteur des 12 entites,
// relations et contrats poses par story 1 via `src/lib/ontology/index.ts`.
// Accent `#0f766e` (teal plus fonce que `#0d9488` pris par Onboarding) pour
// eviter la collision visuelle. Icon `Network` non encore utilise ailleurs.
registerApp({ id: 'ontology',    name: 'Ontology',              icon: Network,         accent: '#0f766e', description: 'Registre des 12 entites metier',              component: OntologyApp });

/** Cognition — STUB standalone. The full cognition layer (routines, manifest,
 *  trust score) now lives inside Sales > Cognition (SovereignGate).
 *  This placeholder keeps the /app/cognition URL from rendering the
 *  "not registered" dead-end if someone opens it from a saved window. */
function CognitionStub(): ReactNode {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--canvas)] border border-[var(--panel-border)] flex items-center justify-center text-2xl">🧠</div>
      <h3 className="text-lg font-bold text-[var(--theme-text)]">Cognition has moved</h3>
      <p className="text-sm text-[var(--theme-text-muted)] max-w-md">
        The cognition layer (routines, manifest, trust score, SovereignGate) now lives inside
        <strong> Sales &gt; Cognition</strong> as a section of the editorial Pipeline. This standalone
        window is a stub kept for navigation continuity.
      </p>
    </div>
  );
}
registerApp({ id: 'cognition',  name: 'Cognition',              icon: BrainCircuit,    accent: '#7c3aed', description: 'SovereignGate — now inside Sales',             component: CognitionStub, hidden: true });
