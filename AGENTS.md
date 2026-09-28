# Project architecture

- Keep the Hayom Yom corpus bundled in `src/data/hayom-yom.ts` and derive Hebrew dates with `Intl`; this preserves offline reading without reusing the APK's restricted date-conversion code.
