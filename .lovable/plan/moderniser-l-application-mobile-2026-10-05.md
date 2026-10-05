# Moderniser l’application mobile

## Résultat
- Remplacer la grande horloge de l’application par un ciel vivant reprenant le soleil, la lune et la météo réelle du site.
- Conserver le bandeau des jours et afficher l’heure plus discrètement dans la scène.
- Harmoniser « Cette semaine », les onglets, le live et les cartes avec le verre bleu, les contrastes et les accents dorés de l’accueil.
- Garder tous les contenus, le compte, l’onglet Promesses, le bouton Don et les invitations d’installation et de notifications.

## Périmètre
- Modifier uniquement la présentation mobile de `/APP` et de l’accueil sur téléphone.
- Ne pas modifier le site sur ordinateur ni le mode TV.
- Vérifier le rendu sur plusieurs largeurs de téléphone et le défilement tactile.

## Détails techniques
- Extraire une variante mobile réutilisable de la scène solaire existante, alimentée par les horaires réels du jour.
- Garder les calculs actuels des horaires et la navigation par jour.
- Utiliser les couleurs et effets déjà présents dans le projet, avec animations allégées sur mobile et prise en charge de la réduction des animations.
