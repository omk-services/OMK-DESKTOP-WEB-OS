/** App discovery — central registration of every Coach OS app.
 *  Registration order = desktop-icon order (OMK Business OS sidebar grouping). */
import { LayoutDashboard, UserCog, ClipboardList, Cpu, Contact, CheckSquare, Store, Boxes, Sprout, Handshake, Wallet, Scale, Settings, Sparkles } from 'lucide-react';
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
import { OnboardingApp } from '../apps/onboarding/OnboardingApp';

registerApp({ id: 'dashboard',   name: 'Dashboard',            icon: LayoutDashboard, accent: '#059669', description: 'Ecosystem Vitals — the home view',              component: DashboardApp });
registerApp({ id: 'people',      name: 'People / Agents',      icon: UserCog,         accent: '#0891b2', description: 'Your team and the agents on the People domain',  component: PeopleApp });
registerApp({ id: 'operations',  name: 'Operations',           icon: ClipboardList,   accent: '#4f46e5', description: 'Runbooks, knowledge base, incidents',            component: OperationsApp });
registerApp({ id: 'it-rd',       name: 'IT / R&D',             icon: Cpu,             accent: '#7c3aed', description: 'Kernel status, experiments, deploys',            component: ItRdApp });
registerApp({ id: 'clients',     name: 'Clients',              icon: Contact,         accent: '#2563eb', description: 'Accounts, onboarding and churn risk',            component: ClientsApp });
registerApp({ id: 'tasks',       name: 'Tasks',                icon: CheckSquare,     accent: '#0d9488', description: 'What needs you today',                           component: TasksApp });
registerApp({ id: 'marketplace', name: 'Marketplace',          icon: Store,           accent: '#db2777', description: 'Sandboxed integrations',                         component: MarketplaceApp });
registerApp({ id: 'product',     name: 'Product',              icon: Boxes,           accent: '#9333ea', description: 'Roadmap, backlog, releases',                     component: ProductApp });
registerApp({ id: 'growth',      name: 'Growth',               icon: Sprout,          accent: '#16a34a', description: 'Funnel, channels, experiments',                  component: GrowthApp });
registerApp({ id: 'sales',       name: 'Sales Sanctum',        icon: Handshake,       accent: '#ea580c', description: 'Pipeline, deals, forecast',                      component: SalesApp });
registerApp({ id: 'finance',     name: 'Finance',              icon: Wallet,          accent: '#ca8a04', description: 'Unit economics, runway, invoices',               component: FinanceApp });
registerApp({ id: 'legal',       name: 'Legal',                icon: Scale,           accent: '#64748b', description: 'Contracts and AI-Act compliance',                component: LegalApp });
registerApp({ id: 'settings',    name: 'Settings',             icon: Settings,        accent: '#78716c', description: 'General, privacy, integrations',                 component: SettingsApp });
// Onboarding Citadel — the Q4-2026 GTM demo-coach launch (4-question quiz →
// mini-Desktop-OS shell with 4 live demo apps). Auto-opens on first launch.
registerApp({ id: 'onboarding',  name: 'Onboarding (demo)',     icon: Sparkles,        accent: '#0d9488', description: '4-question fit · demo-coach citadel',           component: OnboardingApp, dockSlot: 0 });
