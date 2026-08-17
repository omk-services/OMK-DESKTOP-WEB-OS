---
type: Bundle Index
title: Coach OS — bundle de connaissance
description: Ce que l'on sait de Coach OS, avec la provenance et le niveau de confiance de chaque affirmation.
tags: [coach-os, okf, securite]
generated: { by: human:amdkn, at: 2026-08-17T01:10:00Z }
okf_version: "0.2"
---

# Coach OS — bundle OKF v0.2

Ce bundle suit l'[Open Knowledge Format v0.2](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md).

Il existe pour une raison précise. Sur ce chantier, des affirmations
**mesurées** et des affirmations **supposées** ont plusieurs fois été traitées
au même niveau, et le coût a été réel : six tables appliquées au mauvais projet
Supabase, une sonde de test qui accusait le mauvais coupable, un rapport d'audit
qui se trompait de diagnostic.

OKF v0.2 rend cette distinction lisible par machine. Chaque concept porte :

- `sources` — d'où vient l'affirmation ;
- `generated` — qui l'a écrite, et quand ;
- `verified` — qui l'a **confirmée**, et quand.

Le niveau de confiance se déduit de `verified` :

| `verified` | Niveau |
|---|---|
| absent | **non vérifié** |
| acteurs non-`human:` uniquement | **confirmé par machine** |
| au moins un `human:<id>` | **revu par un humain** |

Une affirmation sans `verified` n'est pas rejetée — elle est simplement
reconnaissable comme non confirmée. C'est tout l'intérêt.

## Concepts

- [Les deux projets Supabase](securite/projets-supabase.md) — lequel l'app
  interroge réellement, et lequel est orphelin.
- [Le modèle d'isolation RLS](securite/modele-rls.md) — les policies, le claim
  JWT, et le point unique de défaillance.
- [Fuite inter-comptes par le cache navigateur](securite/fuite-cache-navigateur.md)
  — reproduite à l'écran.

## Journal

Voir [log.md](log.md).
