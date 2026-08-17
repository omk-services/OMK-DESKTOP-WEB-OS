# FAITS MESURÉS — apps embarquées en iframe

Mesures du 2026-08-17. **Acquises, ne les remesure pas.**

## 1. Les apps publiées ne quittent JAMAIS le navigateur

`src/stores/threeApp.store.ts` (174 lignes) et
`src/lib/saas-builder/ledger.store.ts` (184 lignes) persistent tous deux dans
`localStorage` via Zustand `persist`. **Zéro appel Supabase** — vérifié par
`grep -rn "supabase"` sur les deux fichiers et sur tout `src/lib/saas-builder/` :
aucun résultat.

Clés de persistance :

| Store | Nom logique |
|---|---|
| `threeApp.store.ts` | `three-apps-v1` |
| `ledger.store.ts` | `saas-ledger-v1` |

Depuis le correctif de cloisonnement (2026-08-17), ces noms sont préfixés par
`coach-os:<userId>:<tenantId>:` via `src/lib/auth/storage-scope.ts`.

### Ce que cela explique, symptôme par symptôme

L'utilisateur a observé trois choses. **Les trois découlent de ce seul fait :**

1. « Les apps `TST` et `Test` créées dans SaaS Builder ne sont plus là quand
   j'ouvre OMK dans un autre Chrome » → `localStorage` est **propre au
   navigateur**. Un autre navigateur = un autre disque = zéro app.
2. « `Macro` et `Tearable UI` existent pour le compte Papa Guindo mais pas
   chez OMK » → depuis le préfixage, chaque couple (utilisateur, tenant) a
   **sa propre partition**. Les deux comptes voient deux jeux d'apps
   différents, et le seed ne s'applique qu'à la partition qui n'existait pas.
3. « Il n'y a aucun mécanisme de partage » → il ne peut pas y en avoir : rien
   n'est écrit côté serveur.

**Il n'existe donc aujourd'hui AUCUN multi-tenant pour les apps.** Il n'y a
pas un multi-tenant cassé à réparer : il n'y a rien.

## 2. `macro.com` interdit l'embarquement — définitif

```
$ curl -I https://macro.com/app/component/calls
HTTP/1.1 200 OK
X-Frame-Options: DENY
```

`DENY` signifie : aucun site, jamais. Le navigateur refuse le rendu avant même
de charger. **Aucun correctif côté Coach OS n'est possible** — ni proxy CORS,
ni sandbox, ni attribut d'iframe. C'est le serveur distant qui décide.

À l'inverse, `https://threejs.org/examples/` ne renvoie **aucun** en-tête
`X-Frame-Options` ni `Content-Security-Policy` : il s'embarque sans problème.

**C'est la contrainte structurelle du niveau « Easy »** (URL externe en
iframe) : il ne marche que pour les sites qui l'autorisent, et la majorité des
SaaS sérieux ne l'autorisent pas.

## 3. Le `?q=tearable` — corrigé, mais instructif

Le seed portait
`iframeUrl: 'https://threejs.org/examples/?q=tearable#webgl_physics_cloth'`.

`?q=` est le filtre de recherche de la galerie. **Aucun exemple ne s'appelle
« tearable »** — la cible réelle est `webgl_physics_cloth`. Le filtre ne
rendait donc rien, la barre latérale s'affichait vide, et l'app paraissait
cassée alors que la page chargeait parfaitement.

Corrigé le 2026-08-17 : `?q=` retiré, le `#webgl_physics_cloth` suffit.

**La leçon compte plus que le correctif** : une app embarquée peut être
parfaitement fonctionnelle et paraître morte à cause d'un paramètre d'URL. Il
n'y a aucune erreur, aucune console, aucun code HTTP — juste un écran vide.

## 4. Les trois niveaux d'app

`ThreeProgramApp.tsx` distingue :

| Niveau | Rendu actuel |
|---|---|
| `easy` | `<EasyIframe url={manifest.iframeUrl} />` — URL externe |
| `hard` | `<HardPlaceholder />` — **non implémenté** |
| `expert` | (à vérifier dans le fichier) |

## 5. Les apps générées par SaaS Builder pointent dans le vide

Les AppSpec produites contiennent
`"text/html": "https://placeholder.invalid/<slug>.html"`.

`placeholder.invalid` est un TLD réservé qui **ne résout jamais** (RFC 2606).
L'iframe affiche donc « server IP address could not be found ».

Le SaaS Builder génère la **spécification** d'une app, mais **rien ne
construit ni n'héberge le HTML**. La chaîne s'arrête à l'AppSpec.
