import mazalTovPoster from "@/assets/mazal-tov-eydel.png.asset.json";

export default function MazalTovEydel() {
  return (
    <div className="space-y-3">
      {/* Affiche */}
      <article
        className="rounded-3xl overflow-hidden bg-white"
        style={{ boxShadow: "0 8px 24px rgba(31,78,168,0.18)" }}
      >
        <img
          src={mazalTovPoster.url}
          alt="Mazal Tov à la famille Benamran pour la naissance de leur fille Eydel"
          className="w-full h-auto"
          loading="lazy"
        />
      </article>

      {/* Message */}
      <article className="rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <p className="font-display text-[13px] font-bold text-foreground leading-snug text-center">
          Bonjour à tous ✨
        </p>
        <p className="text-[12px] text-foreground/85 leading-snug text-center mt-2">
          Au nom de tout le 50, nous souhaitons un immense{" "}
          <span className="font-bold">Mazal Tov</span> à toute la famille{" "}
          <span className="font-bold">Benamran</span> pour la naissance de leur
          petite princesse, <span className="font-bold">Eydel</span> 🤍🎀
        </p>
        <p className="text-[12px] text-foreground/85 leading-snug text-center mt-2">
          Que cette petite merveille leur apporte énormément de bonheur, de
          santé et de <span className="font-hebrew" dir="rtl">נחת</span>, et
          qu'elle grandisse <span className="font-hebrew" dir="rtl">בעזרת ה׳</span>{" "}
          dans la joie, la <span className="font-hebrew" dir="rtl">ברכה</span> et
          la réussite !
        </p>
        <p className="font-display text-base font-bold text-center text-primary mt-3">
          Mazal Tov ! ❤️✨
        </p>
      </article>
    </div>
  );
}
