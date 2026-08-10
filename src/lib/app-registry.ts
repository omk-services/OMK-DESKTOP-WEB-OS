/** App Registry — manifest-based app loading (forked from Life OS canon).
 *  Apps self-register via their register.ts side-effect module. */
import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface AppManifest {
  id: string;
  name: string;
  icon: LucideIcon;
  accent?: string;          // per-app accent (defaults to theme accent)
  description: string;
  component: ComponentType;
  dockSlot?: number;
  hidden?: boolean;         // hide from desktop dock (still openable via openApp)
}

const GLOBAL_KEY = '__CITADELLE_APP_REGISTRY__';

const getRegistry = (): Map<string, AppManifest> => {
  if (typeof window !== 'undefined') {
    const registryWindow = window as Window & {
      __CITADELLE_APP_REGISTRY__?: Map<string, AppManifest>;
    };
    registryWindow[GLOBAL_KEY] ??= new Map<string, AppManifest>();
    return registryWindow[GLOBAL_KEY];
  }
  return new Map<string, AppManifest>();
};

const registry = getRegistry();

export function registerApp(manifest: AppManifest): void {
  registry.set(manifest.id, manifest);
}

export function getApp(id: string): AppManifest | undefined {
  return registry.get(id);
}

export function getAllApps(): AppManifest[] {
  return Array.from(registry.values());
}

export function getDockApps(): AppManifest[] {
  return getAllApps()
    .filter(a => a.dockSlot !== undefined)
    .sort((a, b) => (a.dockSlot ?? 0) - (b.dockSlot ?? 0));
}
