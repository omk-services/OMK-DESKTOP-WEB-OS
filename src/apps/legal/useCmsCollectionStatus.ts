/** Loud silence — distinguer « collection absente du registre central » de
 *  « collection vide par construction ».
 *
 *  Brief FIX-7 : `useCmsStore(s => s.items['x']) ?? []` transformait une
 *  collection absente en liste vide, et l'écran disait « aucune donnée » —
 *  un diagnostic faux. La collection « legal_ai_act_checks » (par exemple)
 *  n'était pas dans les 23 collections centrales ; l'utilisateur voyait une
 *  section Conformité vide et pouvait raisonnablement penser que sa
 *  donnée n'avait pas été importée, alors qu'elle n'avait jamais été amorcée.
 *
 *  Le hook `useCmsCollectionStatus` lit à la fois `items` ET `collections` :
 *  `collections` n'est peuplé que par `registerCollectionFor`, donc y
 *  trouver la clé veut dire que la déclaration existe. On renvoie un
 *  status discriminant, et on laisse le composant rendre la bannière
 *  explicite qui convient (cf. `<UnknownCollectionBanner>`).
 *
 *  Ne lève jamais : une section qui plante est pire qu'une section qui
 *  dit clairement ce qui manque. C'est exactement la consigne du brief. */
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
