# Project architecture

- Keep date-specific community schedules in the shared zmanim overrides and apply them before external times in all views; this prevents published office times from being replaced by calculated defaults.

- Use AutoScrollLoop with independently configured pixels-per-second speeds for TV Parasha and Hayom Yom, and CSS subgrid rows for time cards; this preserves calm reading and aligned times independently of content length.
- Keep TV panels free of backdrop filters, bound the sun canvas to Full HD at 30 fps, and swap refresh frames without opacity blending; Android TV compositors can produce black bands under oversized, overlapping filtered layers.
- Render the TV sun through RealisticSun and sunRenderer on a full-width layer, with weather visibility mapped in sun-weather and precipitation above it; this avoids clipped glow and keeps weather transitions independent of trajectory.

- Keep the Hayom Yom corpus bundled in `src/data/hayom-yom.ts` and derive Hebrew dates with `Intl`; this preserves offline reading without reusing the APK's restricted date-conversion code.
- Keep the Chants corpus bundled in `src/data/chants.json` and share it through `ChantsPage`; this preserves the complete first-party songbook independently of the former microsite.
- Build the pledge campaign natively in `src/routes/promesses.tsx` with SiteChrome and the shared chants background; this keeps scrolling and transitions identical to the rest of the site.

- Store brand and install icons as CDN asset pointers; keep the browser favicon independent so logo replacements never overwrite it.
