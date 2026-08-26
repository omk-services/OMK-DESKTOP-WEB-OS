# COMPLIANCE_NOTE — Sprint 4, août 2026

> Domaine : Finance & ROI (Wonder Woman). Technicien engagé : USAgent
> (Compliance). Livrable exigé par `../../SPRINTS.md` S4 : traçabilité
> comptable et conformité aux obligations déclaratives en vigueur.
>
> **Périmètre strict** : USAgent traite la traçabilité comptable
> interne — pas la conformité contractuelle, qui relève d'Aquaman
> (domaine 8, Legal). Cette distinction, posée dans l'escalade du
> 2026-08-02 de `SPRINTS.md`, est tenue ici sans l'élargir.

## Traçabilité comptable — confirmée

Chaque chiffre des trois documents précédents remonte à une source
vérifiable, pas à une estimation orale non tracée :

| Chiffre | Source traçable |
|---|---|
| Coût $0/mois | `COST_MODEL.md`, 8 postes, chacun avec capture/log/déclaration datée |
| RARC $2 520/an | `grep` direct sur `signé:` et `tarification:` de `001_THE_OMK_OFFICE_FDE_ENGAGEMENT.md`, rejoué en S4 (`REPRO.md`) |
| Seuil 100 clients/mois | Déclaration directe du capitaine, 2026-08-26, consignée dans `ROI_METRIC.md` |

**Aucun chiffre financier de ce cycle ne repose sur une estimation non
sourcée.** Là où une valeur restait incertaine (le PaaS année 1 vs
année 2), l'incertitude a été nommée plutôt que résolue par un choix
silencieux — à chaque fois dans les trois documents précédents.

## Ce qui n'est PAS couvert par cette note, et pourquoi

**La conformité contractuelle des Master Agreements** — est-ce que les
termes de `001_THE_OMK_OFFICE_FDE_ENGAGEMENT.md` (tarification,
durée, résiliation) sont juridiquement solides — **n'est pas dans le
périmètre d'USAgent**. C'est un jugement légal, pas comptable.

**Ce qui a changé depuis la dernière fois que ce périmètre a été
posé** : Legal & Compliance (Aquaman, domaine 8) était dormant au
2026-08-02. Il est **activé depuis le 2026-08-24**, date de signature
du 001. USAgent note ce changement sans l'occuper — voir l'escalade
correspondante déjà consignée dans `SPRINTS.md` (« Périmé — Legal est
activé »).

**Ce qui devrait remonter à Aquaman, nommé ici mais pas traité** :
l'écart PaaS année 1 / année 2 n'est pas qu'une question financière —
c'est une lecture de ce que le contrat dit réellement sur son
ancienneté. Si le 001 est daté du 2024-03-11 mais formellement signé
le 2026-08-24, la question de savoir à partir de quand « l'année 1 »
court est une question d'interprétation contractuelle, pas seulement
arithmétique. USAgent la signale ; il ne la tranche pas.

## Obligations déclaratives — état actuel

Aucune activité facturée n'a encore eu lieu au sens fiscal ou
déclaratif : le RARC de $2 520/an est un engagement contractuel signé,
pas un encaissement confirmé dans ce cycle. Rien à déclarer à ce
stade — **ce n'est pas une absence de vigilance, c'est l'état réel de
l'activité**, cohérent avec le diagnostic de
`70_Onthologies/pulse/b2/b2-huit-domaines-en-absence-pas-en-dormance.md` :
le système sort tout juste de l'absence, il n'a pas encore de
mouvement de trésorerie réel à tracer.

**Point de vigilance pour le prochain cycle** : dès le premier
encaissement réel (JaaS, BaaS ou PaaS), ce document devra être révisé
pour couvrir la traçabilité de cet encaissement — pas seulement celle
de l'engagement contractuel qui le précède.

## Verdict

**Traçabilité comptable : confirmée**, sur le périmètre strict
d'USAgent. **Conformité contractuelle : hors périmètre, signalée à
Aquaman** — non traitée par ce document, et ne devrait pas l'être par
un agent qui n'a pas mandat légal pour ça.
