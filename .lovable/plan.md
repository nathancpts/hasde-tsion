# Intégrer Hayom Yom

## Résultat attendu
- Ajouter une rubrique « Hayom Yom » dans l’onglet Étude de l’application.
- Afficher automatiquement l’enseignement correspondant à la date hébraïque du jour sélectionné.
- Ajouter une page complète permettant de parcourir les jours précédents et suivants, avec affichage français, hébreu ou bilingue et taille de texte réglable.
- Afficher également le Hayom Yom du jour sur la TV, dans le tableau de bord existant, sans interaction ni nouvelle fenêtre.

## Contenu et fonctionnement
- Extraire les 386 enseignements français/hébreu présents dans l’APK fourni et les convertir en données sûres pour le site.
- Refaire le calcul de date avec le calendrier hébraïque natif du navigateur, sans reprendre le convertisseur protégé inclus dans l’APK.
- Respecter la gestion particulière d’Adar et Adar II des années embolismiques.
- Conserver le contenu disponible hors connexion une fois l’application chargée.

## Présentation
- Réutiliser les couleurs, typographies, cartes et boutons actuels.
- Sur mobile/web : aperçu dans « Étude », puis lecture complète dans une page dédiée.
- Sur TV : bloc lisible avec défilement automatique doux si le texte dépasse, sans réduire le mode TV.
- Les mises à jour de date suivront automatiquement le changement de jour et le rechargement TV toutes les 10 minutes.

## Vérifications
- Vérifier les correspondances de dates hébraïques, notamment Tichri et les deux Adar.
- Tester la navigation mobile, les choix de langue et de taille, puis l’affichage TV en 1920×1080.
- Contrôler l’absence de fenêtre d’installation/notification sur TV et le bon fonctionnement général.
