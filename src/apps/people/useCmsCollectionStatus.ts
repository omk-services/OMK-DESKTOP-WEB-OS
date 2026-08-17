/** Loud silence — distinguer « collection absente du registre central » de
 *  « collection vide par construction ». Voir le commentaire équivalent dans
 *  `src/apps/legal/useCmsCollectionStatus.ts` pour la justification.
 *
 *  Doublon intentionnel : on évite la dépendance cross-app (people → legal)
 *  pour rester self-contained chaque app. Le contenu est identique. */
import { useCmsStore } from '../../lib/cms/cms.store';
import type { CmsItem } from '../../lib/cms/types';

export type CollectionStatus = 'registered' | 'unknown';

export interface CmsCollectionRead {
  items: CmsItem[];
  status: CollectionStatus;
}

export function useCmsCollectionStatus(collectionId: string): CmsCollectionRead {
  const items = useCmsStore((s) => s.items[collectionId]);
  const defExists = useCmsStore((s) => s.collections[collectionId] !== undefined);
  return {
    items: items ?? [],
    status: defExists ? 'registered' : 'unknown',
  };
}
