/** Loud silence — bannière rendue quand une collection n'est pas dans le
 *  registre central. La différence avec « registre connu mais vide » est
 *  importante : la première état est un défaut qui mérite d'être lisible ;
 *  la seconde est un état neutre qui n'a pas besoin d'un panneau.
 *
 *  Brief FIX-7 : pas d'exception, pas de throw — on *dit* ce qui manque.
 *  Style volontairement sobre (rouge sobre, bordure pointillée) pour
 *  distinguer sans alarmer — l'utilisateur lit, ne panique pas.
 *
 *  Remonté depuis `apps/legal/` et `apps/people/` (doublons identiques sauf
 *  le chemin du test cité) : aucune des deux apps n'importe de l'autre en
 *  passant par ici, l'isolement de domaine reste intact. */
import type { JSX } from 'react';

export type CollectionStatus = 'registered' | 'unknown';

export function UnknownCollectionBanner({
  collectionId,
  status,
  appName,
  testFilePath,
}: {
  collectionId: string;
  status: CollectionStatus;
  appName: string;
  testFilePath: string;
}): JSX.Element | null {
  if (status === 'registered') return null;
  return (
    <div
      role="alert"
      data-unknown-collection={collectionId}
      data-app={appName}
      className="rounded-lg border border-dashed px-3 py-2.5 text-[12px] leading-snug"
      style={{ borderColor: '#dc2626', background: 'rgba(220,38,38,0.06)', color: '#991b1b' }}
    >
      <div className="font-bold tracking-tight">
        Collection inconnue : « {collectionId} »
      </div>
      <div className="mt-0.5 opacity-90">
        Cette section de l'app <strong>{appName}</strong> est vide parce que la
        collection n'a pas été déclarée dans le registre central
        (<code>src/lib/cms/seed.ts</code>). C'est un défaut à corriger — le test
        <code> {testFilePath}</code> l'attrape à chaque
        ajout de collection consommée sans déclaration correspondante.
      </div>
    </div>
  );
}
