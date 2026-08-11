/** The three onboarding tours — catalogue consumed by `TourOverlay`.
 *
 *  Design (cf. RAPPORT_G §0):
 *   - Each step points at ONE element using one of three flavours:
 *       (a) `selector`   — a DOM element with a stable `data-*` marker,
 *       (b) `windowId`   — a shell-store window (survives drag, close, minimize),
 *       (c) `zone`       — a viewport-relative box for desktop chrome without
 *                          markers (TopBar, AppDrawer, DesktopIcons).
 *   - The shell store is the source of truth for window positions. The
 *     engine RAF-throttles a re-read on every animation frame, so a window
 *     mid-drag keeps the bubble pinned to it.
 *   - When the target disappears (window closed/minimized, element missing)
 *     the step auto-advances after a 900ms beat. No orphan bubble ever
 *     sits on screen.
 *
 *  Replay lives in Settings → Help (the existing `tourReplayList` reuses
 *  these ids).
 */
import type { TourDef } from '../../../onboarding/tourStore';
import { openAppFromTour } from './helpers';

const TOPBAR_ZONE = { top: 0, left: 0, width: 1280, height: 40 };
const DESKTOP_ICONS_ZONE = { top: 60, left: 60, width: 320, height: 540 };
const DRAWER_BUTTON_ZONE = { top: 0, left: 1140, width: 140, height: 40 };

export const TOURS: Record<string, TourDef> = {
  /* ── Tour 1: Premiere ouverture — bureau, dock, barre du haut (5 etapes max) ── */
  'g-first-open': {
    id: 'g-first-open',
    title: 'Premiere ouverture',
    hint: 'Le bureau, le dock, la barre du haut — 5 etapes pour demarrer.',
    steps: [
      {
        id: 'topbar',
        title: 'La barre du haut',
        body: 'Tout ce qui est global vit ici : horloge, profil, theme. Elle reste visible par-dessus toutes les fenetres.',
        zone: TOPBAR_ZONE,
        anchor: 'bottom',
      },
      {
        id: 'desktop-icons',
        title: 'Les icones du bureau',
        body: 'Toutes vos apps installees apparaissent sur le fond d ecran. Double-cliquez pour ouvrir.',
        zone: DESKTOP_ICONS_ZONE,
        anchor: 'right',
      },
      {
        id: 'open-drawer',
        title: 'Le tiroir d applications',
        body: 'Le bouton en haut a droite ouvre un launchpad : toutes les apps, avec une recherche.',
        zone: DRAWER_BUTTON_ZONE,
        anchor: 'bottom',
      },
      {
        id: 'first-app',
        title: 'Ouvrir une premiere app',
        body: 'On ouvre Clients pour la suite : chaque app devient une fenetre deplacable.',
        actionLabel: 'Ouvrir Clients',
        onAction: () => { openAppFromTour('clients'); },
        windowId: 'clients',
        anchor: 'left',
      },
      {
        id: 'window-controls',
        title: 'Les feux de la fenetre',
        body: 'En haut a gauche de la fenetre : rouge pour fermer, jaune pour reduire, vert pour plein ecran.',
        windowId: 'clients',
        insideWindowSelector: '[data-window-frame][data-window-id="clients"] > div',
        anchor: 'right',
      },
    ],
  },

  /* ── Tour 2: Premier agent — pourquoi rien ne s'ecrit sans approbation ── */
  'g-first-agent': {
    id: 'g-first-agent',
    title: 'Premier agent',
    hint: 'Les personnages, comment leur parler, et pourquoi rien ne s ecrit sans vous.',
    steps: [
      {
        id: 'open-people',
        title: 'Ouvrir People',
        body: 'L app People est votre escadron : un personnage par mission.',
        actionLabel: 'Ouvrir People',
        onAction: () => { openAppFromTour('people'); },
        windowId: 'people',
        anchor: 'left',
      },
      {
        id: 'people-overview',
        title: 'La vue d escadron',
        body: 'Vous voyez qui fait quoi, en un coup d oeil.',
        windowId: 'people',
        insideWindowSelector: '[data-section="Overview"]',
        anchor: 'bottom',
      },
      {
        id: 'open-agent',
        title: 'Ouvrir un agent',
        body: 'Cliquez sur un agent : vous voyez ses missions en cours.',
        windowId: 'people',
        insideWindowSelector: '[data-window-frame][data-window-id="people"] [data-section="Cadence"]',
        anchor: 'right',
      },
      {
        id: 'approvals',
        title: 'La file d approbation',
        body: 'C est la cle : aucune ecriture ne part sans votre OK visible ici. Un agent propose, vous decidez.',
        windowId: 'people',
        insideWindowSelector: '[data-section="Approvals"]',
        anchor: 'left',
      },
    ],
  },

  /* ── Tour 3: Premiere donnee — creer un element dans une collection ── */
  'g-first-data': {
    id: 'g-first-data',
    title: 'Premiere donnee',
    hint: 'Creer un client, du bouton jusqu a la liste — 4 etapes.',
    steps: [
      {
        id: 'open-clients',
        title: 'Ouvrir Clients',
        body: 'On va creer un client de bout en bout.',
        actionLabel: 'Ouvrir Clients',
        onAction: () => { openAppFromTour('clients'); },
        windowId: 'clients',
        anchor: 'left',
      },
      {
        id: 'new-button',
        title: 'Le bouton Nouveau',
        body: 'En haut de la liste, le bouton declenche le formulaire de creation.',
        windowId: 'clients',
        insideWindowSelector: '[data-collection-action="create"], [data-action="create"], button[aria-label*="ouveau"], button[aria-label*="ew"]',
        anchor: 'bottom',
      },
      {
        id: 'fill-form',
        title: 'Remplir le formulaire',
        body: 'Les champs marques d une etoile sont obligatoires. Les autres sont des indices — plus vous en donnez, plus les agents sont precis.',
        windowId: 'clients',
        insideWindowSelector: 'form, [data-form-root]',
        anchor: 'right',
      },
      {
        id: 'see-in-list',
        title: 'Le client apparait dans la liste',
        body: 'Apres validation, l element est cree et la liste se met a jour sans rechargement.',
        windowId: 'clients',
        insideWindowSelector: '[data-window-frame][data-window-id="clients"] main, [data-window-frame][data-window-id="clients"] [role="list"], [data-window-frame][data-window-id="clients"] [role="table"]',
        anchor: 'top',
      },
    ],
  },
};
