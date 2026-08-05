### DW-1: Aucune suite automatisée ne verrouille les 9 alias ; tout retrait futur passerait `scripts/verify-no-regression.sh` sans broncher (la story 2 « Garde-fou contre le retour des variables orphelines » es
origin: spec-deferred 57087c0fe820
location: src/lib/themes/store.ts:88-96 (les 9 setProperty ajoutés)
source_spec: `1-cabler-les-9-variables-css-orphelines.md`
severity: medium
reason: `find src -name "*.test.*" -o -name "*.spec.*"` retourne 0 fichier. Aucun test n'importe `themes/store`, n'appelle `applyThemeTokens`, ni ne lit `getComputedStyle(:root).getPropertyValue('--canvas')`. La story 2 du même épic est précisément ce test, avec son AC « le test doit passer au vert une fois la story 1 appliquée ».
status: open

### DW-2: Les 9 alias sont posés « jusqu'à migration complète » mais aucun signal machine-readable (JSDoc @deprecated, console.warn, ticket de suivi) n'accompagne la promesse ; les alias risquent de vivre « pou
origin: spec-deferred 5214e2abd2df
location: n/a
source_spec: `1-cabler-les-9-variables-css-orphelines.md`
severity: low
reason: Le commentaire mentionne la migration mais ne la dote ni d'un échéancier, ni d'un lint rule, ni d'un ticket attaché. Hors périmètre explicite de cette story (la spec interdit d'ajouter de nouvelles variables et de modifier la signature — un @deprecated sur les alias eux-mêmes n'est pas une variable, mais une instrumentation supplémentaire dépasse l'AC).
status: open
