const HELLOASSO_SIMHAT_TORAH =
  "https://www.helloasso.com/associations/hassidim-de-sion/evenements/simhat-torah";

const PHONE_DISPLAY = "07 67 95 94 26";
const PHONE_TEL = "+33767959426";

export default function SimhatTorahEvent() {
  return (
    <div className="space-y-3">
      {/* En-tête */}
      <article
        className="btn-blue-animated rounded-3xl p-5 text-center"
        style={{ boxShadow: "0 8px 24px rgba(31,78,168,0.25)" }}
      >
        <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-white/80 mb-1">
          Sim'hat Torah 5787
        </p>
        <h3 className="font-display text-2xl font-bold text-white leading-tight">
          La Grande Séouda
        </h3>
        <p className="text-[12px] text-white/85 mt-1">
          🕊️ Torah · Joie · Partage 🎶
        </p>
      </article>

      {/* Introduction */}
      <article className="rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <p className="font-display text-sm font-bold text-foreground leading-snug text-center">
          À l'occasion de Sim'hat Torah, la communauté Hasdé Tsion vous invite à partager
          tous ensemble une magnifique Séouda de fête, dans une ambiance de joie, de Torah,
          de chants et d'unité. 🎶✨
        </p>
        <p className="text-[12px] text-foreground/75 leading-snug text-center mt-2">
          Un grand moment de convivialité et de réjouissances pour célébrer ensemble
          la joie de la Torah !
        </p>
      </article>

      {/* Participer au financement */}
      <article className="rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <h3 className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#1f4ea8] mb-3">
          Offrir ou participer
        </h3>
        <p className="text-[13px] text-foreground/85 leading-snug">
          💙 Vous souhaitez offrir ou participer au financement de la Séouda ?
        </p>
        <p className="text-[12px] text-foreground/75 leading-snug mt-2">
          Chaque participation contribuera à faire de cette fête un moment exceptionnel
          pour toute la communauté et vous permettra de vous associer à cette belle Mitsva.
        </p>

        <a
          href={`tel:${PHONE_TEL}`}
          className="btn-cta btn-blue-animated mt-4 w-full text-white"
        >
          <span className="text-[14px]">📞</span>
          <span>{PHONE_DISPLAY}</span>
        </a>
      </article>

      {/* Réservation HelloAsso */}
      <article className="rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <h3 className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#1f4ea8] mb-3">
          Réservations
        </h3>
        <a
          href={HELLOASSO_SIMHAT_TORAH}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-cta btn-blue-animated w-full text-white"
        >
          Réserver sur HelloAsso
        </a>
        <p className="rounded-xl bg-[var(--blue-soft)] px-3 py-2 text-[12px] text-foreground/85 leading-snug mt-3">
          <span className="font-semibold">Hasdé Tsion</span> — 50 rue du Bois de Boulogne,
          Neuilly-sur-Seine
        </p>
        <p className="text-center text-[12px] text-foreground/75 mt-3">
          Tous ensemble pour une fête inoubliable !
        </p>
        <p className="font-hebrew text-center text-2xl text-primary mt-4" dir="rtl">
          סימחת תורה שמח
        </p>
      </article>

      {/* Aperçu plein écran de l'affiche */}
      {posterOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setPosterOpen(false)}
          role="dialog"
          aria-label="Affiche de la Grande Séouda de Sim'hat Torah"
        >
          <img
            src={simhatTorahPoster.url}
            alt="Affiche — La Grande Séouda de Sim'hat Torah"
            className="max-h-full max-w-full rounded-xl shadow-2xl"
          />
          <button
            type="button"
            className="absolute top-4 right-4 rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-foreground"
            onClick={() => setPosterOpen(false)}
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}
