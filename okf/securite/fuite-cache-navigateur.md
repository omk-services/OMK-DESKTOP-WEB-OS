---
type: Vulnerability
title: Fuite inter-comptes par le cache du navigateur
description: Les stores persistent sous des clés globales, non préfixées par utilisateur ni par tenant ; deux comptes sur un même navigateur partagent leur état.
tags: [confidentialite, localstorage, multi-tenant, critique]
severity: eleve
generated: { by: claude-opus-5, at: 2026-08-17T01:02:00Z }
verified:
  - { by: human:amdkn, at: 2026-08-17T01:05:00Z }
sources:
  - id: greps-stores
    resource: src/stores/
    title: Relevé des clés de persistance Zustand
    author: claude-opus-5
    last_modified: 2026-08-17
  - id: repro-utilisateur
    resource: "reproduction manuelle — deux comptes Gmail, deux profils Chrome, même déploiement"
    title: Reproduction à l'écran par le propriétaire du produit
    author: human:amdkn
    last_modified: 2026-08-17
okf_version: "0.2"
---

> **Niveau de confiance : revu par un humain.** Ce défaut a été reproduit à
> l'écran par le propriétaire du produit, pas seulement déduit du code.[^repro-utilisateur]

# Constat

Une vingtaine de stores persistent dans `localStorage` sous des clés
**globales**, sans préfixe d'utilisateur ni de tenant :[^greps-stores]

```
coach-os-themes-v1          coach-os-desktop-layout-v1
coach-os-assistant-v1       coach-os-scenarios-v1
coach-os-three-apps-v1      coach-os-app-visibility-v1
coach-os-canvas-fx-v1
```

s'y ajoutent `tenant.store`, `dock.store`, `shell.store`, `wallpaper`, `tours`,
le `scope-store` d'ontologie et le registre du SaaS builder.

`localStorage` est cloisonné **par origine**, pas par compte. Comme tous les
comptes partagent l'origine `omk-desktop-web-os.vercel.app`, ils partagent le
même espace.

# Impact

Sur un navigateur donné, après déconnexion de A et connexion de B, B hérite de
l'état de A. Constaté : fond d'écran, thème et parcours d'accueil ne suivent pas
le compte connecté.

La gravité ne vient pas du fond d'écran. Elle vient de ce que certaines de ces
clés portent du **contenu** :

- `coach-os-assistant-v1` — historique de conversation avec l'assistant ;
- `coach-os-scenarios-v1` — scénarios d'ontologie ;
- le registre du SaaS builder ;
- `coach-os-desktop-layout-v1` — quelles apps l'utilisateur précédent ouvrait.

Sur un poste partagé — un cabinet, un poste d'accueil, un ordinateur familial —
c'est une fuite de confidentialité entre clients, et le RLS n'y peut rien : la
donnée n'a jamais quitté le navigateur.

# Scénario

1. Le coach A se connecte depuis le poste d'accueil, discute avec l'assistant.
2. A se déconnecte. La session Supabase est bien fermée.
3. Le coach B se connecte sur le même navigateur.
4. B ouvre l'assistant et lit la conversation de A.

# Correctif

Deux mesures, complémentaires :

1. **Préfixer chaque clé** par l'identifiant de l'utilisateur et du tenant :
   `coach-os:<user_id>:<tenant_id>:assistant-v1`. Un compte ne peut alors plus
   lire l'espace d'un autre, même sur le même navigateur.
2. **Purger à la déconnexion.** `signOut` doit effacer toutes les clés
   `coach-os*`, pas seulement fermer la session Supabase. C'est le filet de
   sécurité si un préfixe est oublié.

La mesure 2 seule ne suffit pas : elle ne protège pas d'une fermeture d'onglet
sans déconnexion. La mesure 1 seule ne suffit pas non plus : elle laisse la
donnée sur le disque. Il faut les deux.

[^greps-stores]: Relevé des appels `persist()` dans `src/stores/`.
[^repro-utilisateur]: Reproduction manuelle, deux comptes Gmail distincts.
