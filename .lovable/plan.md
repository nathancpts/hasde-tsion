# Intégrer le microsite Chants

## Résultat attendu

- Remplacer le lien externe « Chants » par une vraie page `/chants` intégrée à Hasdé Tsion.
- Reprendre toutes les informations et fonctions utiles du microsite actuel : album de référence, 12 chants, titres hébreux et translittérés, sources, livret/paroles disponibles et lecteur audio.
- Conserver une présentation sombre, soignée et cohérente avec le site normal, adaptée à l’ordinateur, la tablette et le téléphone.
- Ajouter sur l’accueil du site normal un aperçu compact des chants, avec accès direct à la page complète.
- Ne modifier ni la vue `/TV`, ni la web app `/APP`, ni leurs contenus actuels.

## Page Chants

- Créer une navigation, une liste complète des chants et une zone de lecture claire.
- Reproduire les actions réellement présentes sur le microsite : lecture/pause, changement de piste, progression, pistes disponibles, accès aux textes et sources.
- Héberger dans le projet les données et visuels nécessaires ; conserver uniquement les services externes indispensables à l’écoute ou aux sources.
- Ajouter les informations de partage propres à la page Chants.

## Aperçu sur l’accueil

- Insérer une section Chants dans la page de présentation, avec quelques morceaux mis en avant, un contrôle d’écoute simple et un bouton vers `/chants`.
- Remplacer l’ancien lien vers Netlify par le lien interne `/chants`.
- Isoler cet aperçu pour qu’il n’affecte pas les animations existantes de la page.

## Vérifications

- Vérifier chaque piste, lien, texte et contrôle repris du microsite.
- Tester la page Chants et l’aperçu d’accueil sur ordinateur, tablette et téléphone.
- Confirmer que `/TV` et `/APP` restent inchangés et que toutes les pages se chargent sans erreur.

## Détails techniques

- Nouvelle route TanStack Start `/chants` avec ses propres métadonnées.
- Données des chants regroupées dans un module local partagé par la page et l’aperçu.
- Lecteur audio React accessible, sans intégrer le microsite externe dans une iframe.
- Aperçu injecté uniquement dans `public/presentation.html`, qui constitue le site normal sur grand écran.