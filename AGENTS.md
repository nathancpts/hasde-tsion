# Project architecture

- Keep the Hayom Yom corpus bundled in `src/data/hayom-yom.ts` and derive Hebrew dates with `Intl`; this preserves offline reading without reusing the APK's restricted date-conversion code.
- Keep the Chants corpus bundled in `src/data/chants.json` and share it through `ChantsPage`; this preserves the complete first-party songbook independently of the former microsite.
- Keep the standalone pledge campaign bundled in `public/promesses.html` and expose it through the `/promesses` route; this preserves the supplied campaign layout and client-side behavior.
- Keep the mobile sky isolated in `MobileSky` and reuse live zmanim inputs from `MobileLayout`; this preserves the desktop presentation and TV scene independently.
