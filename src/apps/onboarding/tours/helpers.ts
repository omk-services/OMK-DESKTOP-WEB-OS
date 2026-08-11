/** Ouverture d'une app depuis une etape de visite.
 *
 *  Ce fichier avait disparu avec la citadelle — le faux bureau simule que
 *  l'app Onboarding hebergeait. `threeTours.ts` l'importait toujours, si bien
 *  que le build cassait sur `UNRESOLVED_IMPORT` alors que `tsc --noEmit`
 *  restait muet : un type-check propre ne garantit pas qu'un module existe a
 *  la resolution. Les deux mesures comptent, et pas la meme chose.
 *
 *  La version d'avant ouvrait une fenetre du faux bureau. Les visites tournent
 *  desormais sur le VRAI bureau — `TourOverlay` est monte au niveau du shell
 *  (`Desktop.tsx`) et survit a la fermeture de n'importe quelle fenetre. Cette
 *  version s'adresse donc au vrai magasin de fenetres.
 */
import { useShellStore } from '../../../stores/shell.store';
import { getAllApps } from '../../../lib/app-registry';

/** Ouvre l'app demandee, ou la ramene devant si elle est deja ouverte.
 *
 *  Le titre vient du registre : le passer en dur ici produirait un libelle
 *  qui derive du jour ou une app est renommee — ce qui vient d'arriver avec
 *  « Onboarding » devenu « Audit ».
 *
 *  Un identifiant inconnu ne doit pas passer en silence : une etape de visite
 *  qui pointe une app disparue laisserait l'utilisateur devant une bulle qui
 *  designe le vide. On le signale.
 */
export function openAppFromTour(appId: string): void {
  const app = getAllApps().find((a) => a.id === appId);
  if (!app) {
    console.error(
      `[visite] etape impossible : aucune app « ${appId} » dans le registre. ` +
        `L'app a-t-elle ete renommee ? (cf. onboarding -> audit)`,
    );
    return;
  }

  const { windows, openApp, focusApp } = useShellStore.getState();
  const deja = windows.find((w) => w.id === appId && w.isOpen);
  if (deja) focusApp(appId);
  else openApp(app.id, app.name);
}
