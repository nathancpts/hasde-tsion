## Objectif

Sur la capture, la status bar (heure, signal, batterie) est posée sur le bleu du hero mais ses icônes restent foncées et tranchent. Tu veux qu'elle s'intègre au bleu — icônes/heure claires, fond bleu continu, comme une app native.

## Diagnostic

- `viewport-fit=cover` ✓ déjà en place : le bleu passe bien derrière la status bar.
- `theme-color: #1f4ea8` (clair) ✓ : couleur Chrome Android OK, mais iOS Safari force des icônes sombres car cette nuance de bleu est jugée trop claire.
- `apple-mobile-web-app-status-bar-style: black-translucent` ✓ : ne s'applique qu'en mode PWA installée (« Sur l'écran d'accueil »). En Safari classique iOS, c'est ignoré.

## Changements

### 1. `src/routes/__root.tsx`
- Passer le `theme-color` (clair + sombre) à un bleu plus profond `#0F3D7A` — c'est le même bleu que la base du dégradé hero, et il déclenche les icônes blanches sur iOS Safari et Chrome Android.

### 2. `src/routes/index.tsx` (MobileLayout)
- Ajouter en haut du hero un voile vertical (~`env(safe-area-inset-top) + 24px`) en dégradé `#0F3D7A → transparent` pour que la zone sous la status bar soit visuellement homogène avec la couleur de theme-color, sans casser le dégradé clair du reste du hero.
- Garder le `paddingTop: calc(env(safe-area-inset-top) + 1rem)` pour que le contenu reste sous l'encoche.

### 3. PWA installée (iOS « Ajouter à l'écran d'accueil »)
- `apple-mobile-web-app-status-bar-style` reste `black-translucent` : icônes blanches, fond transparent → on voit le bleu du hero directement derrière.

## Résultat attendu

- Safari iOS / Chrome Android : barre de statut bleu profond uniforme, icônes claires lisibles.
- PWA installée iOS/Android : status bar transparente posée sur le hero bleu, icônes claires.
- Aucun changement sur la version TV/desktop.
