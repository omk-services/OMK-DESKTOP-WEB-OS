/** App discovery — central registration of every Coach OS app.
 *  Registration order = desktop-icon order (OMK Business OS sidebar grouping). */
import { LayoutDashboard, UserCog, ClipboardList, Cpu, Contact, CheckSquare, Store, Boxes, Sprout, Handshake, Wallet, Scale, Settings, Compass, Shield, Wand2, Network, BrainCircuit, AppWindow, Hammer } from 'lucide-react';
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
// AppStoreApp et SaaSBuilderApp ne sont plus importes : les deux apps sont
// bloquees plus bas. Les composants restent dans le depot, intacts ; pour
// rouvrir une app, remettre son import ici et son composant sur la ligne
// `registerApp` correspondante.
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
import { CognitionApp } from '../apps/cognition/CognitionApp';
import { creerPageEnConstruction } from '../apps/en-construction/EnConstructionApp';

registerApp({ id: 'dashboard',   name: 'Dashboard',            icon: LayoutDashboard, accent: '#059669', description: 'Ecosystem Vitals — the home view',              component: DashboardApp });
registerApp({ id: 'people',      name: 'People / Agents',      icon: UserCog,         accent: '#0891b2', description: 'Your team and the agents on the People domain',  component: PeopleApp });
registerApp({ id: 'operations',  name: 'Operations',           icon: ClipboardList,   accent: '#4f46e5', description: 'Runbooks, knowledge base, incidents',            component: OperationsApp });
registerApp({ id: 'it-rd',       name: 'IT / R&D',             icon: Cpu,             accent: '#7c3aed', description: 'Kernel status, experiments, deploys',            component: ItRdApp });
registerApp({ id: 'clients',     name: 'Clients',              icon: Contact,         accent: '#2563eb', description: 'Accounts, onboarding and churn risk',            component: ClientsApp });
registerApp({ id: 'tasks',       name: 'Tasks',                icon: CheckSquare,     accent: '#0d9488', description: 'What needs you today',                           component: TasksApp });
registerApp({ id: 'marketplace', name: 'Marketplace',          icon: Store,           accent: '#db2777', description: 'Sandboxed integrations',                         component: MarketplaceApp });
// ---------------------------------------------------------------------------
// App Store et SaaS Builder sont BLOQUES (2026-08-17).
//
// Le blocage se pose ici, sur le `component` du manifeste, parce que c'est
// le seul point de passage : toute ouverture, d'ou qu'elle vienne (icone du
// bureau, dock, menu Apps, `openApp` appele par une autre app), rend ce que
// le registre declare. Masquer un bouton d'entree n'aurait ferme qu'une
// porte sur plusieurs.
//
// Effet voulu : la sidebar « Sections » disparait avec le reste. Elle est
// rendue a l'interieur de chaque app, pas par la coquille de fenetre.
//
// Le blocage est une decision de mise a disposition, pas une suppression de
// code : `AppStoreApp.tsx` et `SaaSBuilderApp.tsx` sont intacts. Pour rouvrir
// une app, remettre son import en tete de fichier et son composant sur la
// ligne `registerApp` correspondante.
//
// Pourquoi chacune est bloquee :
//   - App Store : le niveau « Easy » embarque une URL externe dans un
//     iframe. Mesure du 2026-08-17 sur 8 cibles : sept refusent
//     l'embarquement par un tiers (X-Frame-Options ou frame-ancestors).
//     Aucun correctif cote client n'existe.
//   - SaaS Builder : les AppSpec produites pointent vers
//     `https://placeholder.invalid/<slug>.html`. `.invalid` est un TLD
//     reserve (RFC 2606) qui ne resout jamais. L'app produit une
//     specification ; rien ne construit ni n'heberge le HTML.
// ---------------------------------------------------------------------------
registerApp({ id: 'app-store',    name: 'App Store',             icon: AppWindow,       accent: '#7c3aed', description: '3D mini-programmes (Easy / Hard / Expert)',       component: creerPageEnConstruction({
  nom: 'App Store',
  raison:
    "Les outils qu'on voulait y embarquer refusent de s'afficher dans une " +
    "fenetre d'un autre site. On revoit la maniere de les integrer avant " +
    "de rouvrir l'app.",
}) });
registerApp({ id: 'saas-builder', name: 'SaaS Builder',          icon: Hammer,          accent: '#7c3aed', description: 'Genere des AppSpec JSON (Bench Studio-inspired)', component: creerPageEnConstruction({
  nom: 'SaaS Builder',
  raison:
    "L'atelier sait decrire une application, mais rien ne la construit ni " +
    "ne l'heberge encore. Tant que ce maillon manque, ce qui en sort ne " +
    "s'ouvre pas.",
}) });
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
// Cognition — bureau complet de la couche Cognition (Brief N, 2026-08-11).
// Cinq sections : Overview, Routines (CRUD), Journal, Graphe, Souverainete.
// Accent violet `#7c3aed` (coherent avec l'iconographie neuromorphique).
registerApp({ id: 'cognition',  name: 'Cognition',              icon: BrainCircuit,    accent: '#7c3aed', description: 'Routines, journal, manifeste, souverainete du savoir', component: CognitionApp });
