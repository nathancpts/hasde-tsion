import { useEffect, useRef, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteChrome } from "@/components/SiteChrome";
import { submitPledge } from "@/lib/promesses.functions";

export const Route = createFileRoute("/promesses")({
  head: () => ({
    meta: [
      { title: "Promesses de dons — Hasdé Tsion" },
      { name: "description", content: "Promesses de dons de la synagogue Hasdé Tsion. Promettez aujourd’hui et réglez au cours de l’année." },
      { property: "og:title", content: "Promesses de dons — Hasdé Tsion" },
      { property: "og:description", content: "Soutenez Hasdé Tsion avec une promesse de don pour l’année." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PromessesPage,
});

const HELLOASSO = "https://www.helloasso.com/associations/hassidim-de-sion/evenements/birkat-hachana-5787";
const AMOUNT = 2600;
const RATE = 66;
const NET = Math.round(AMOUNT * (1 - RATE / 100));
const MONTHLY = Math.round(AMOUNT / 12);
const eur = (n: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n) + " €";

const INTRO = [
  "En ce début d'année 5787, la communauté Hasdé Tsion vous invite à vous associer à la Birkat Hachana.",
  "Votre promesse fait vivre la synagogue tout au long de l'année.",
  "Elle soutient les offices, l'étude de la Torah et l'entretien de notre maison.",
];
const ENGAGEMENT = [
  "À chaque ouverture du Hekhal, votre nom sera prononcé devant les Sifré Torah.",
  "Nous appellerons sur vous et sur les vôtres la bénédiction, une parnassa large et une brioute complète.",
  "Que toutes vos entreprises soient couronnées de réussite.",
];
const CALENDAR = ["Règlement possible jusqu'à Roch Hachana 5788.", "En une fois ou en plusieurs fois, à votre convenance."];
const BLESSING_HE =
  "מִי שֶׁבֵּרַךְ אֲבוֹתֵינוּ אַבְרָהָם יִצְחָק וְיַעֲקֹב, מֹשֶׁה וְאַהֲרֹן, דָּוִד וּשְׁלֹמֹה, הוּא יְבָרֵךְ אֶת כָּל הַנּוֹדְרִים וְהַנּוֹתְנִים לִצְדָקָה לְבֵית הַכְּנֶסֶת חַסְדֵּי צִיּוֹן. בִּשְׂכַר זֶה, הַקָּדוֹשׁ בָּרוּךְ הוּא יִשְׁמְרֵם וְיַצִּילֵם מִכָּל צָרָה וְצוּקָה וּמִכָּל נֶגַע וּמַחֲלָה, וְיִשְׁלַח בְּרָכָה וְהַצְלָחָה בְּכָל מַעֲשֵׂה יְדֵיהֶם, פַּרְנָסָה טוֹבָה וּבְרִיאוּת הַגּוּף, וְיִזְכּוּ לִרְאוֹת בָּנִים וּבְנֵי בָנִים עוֹסְקִים בַּתּוֹרָה וּבַמִּצְוֹת, וְתִהְיֶה לָהֶם שָׁנָה טוֹבָה וּמְתוּקָה. וְנֹאמַר אָמֵן.";
const BLESSING_FR =
  "Que Celui qui a béni nos pères Avraham, Its'hak et Yaakov, Moché et Aharon, David et Chelomo, bénisse tous ceux qui promettent et donnent à la synagogue Hasdé Tsion. Par ce mérite, que le Saint, béni soit-Il, les garde de toute épreuve et de toute maladie, qu'Il envoie bénédiction et réussite dans toutes leurs entreprises, une parnassa abondante et une pleine santé, qu'ils voient leurs enfants et petits-enfants attachés à la Torah et aux mitsvot, et que cette année leur soit bonne et douce. Et disons Amen.";
const SCHEDULES = [
  "Au cours de l'année, à ma convenance",
  "En plusieurs fois au fil de l'année",
  "En une fois, dans le mois",
  "Avant Pessah 5787",
  "Avant Roch Hachana 5788",
];

function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setShown(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(40px)",
        transition: `opacity 1.1s cubic-bezier(.16,1,.3,1) ${delay}s, transform 1.1s cubic-bezier(.16,1,.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

const panel = "h-full rounded-[24px] border border-chant-line bg-chant-panel p-6 backdrop-blur-xl sm:p-8";
const eyebrow = "text-[11px] font-bold uppercase tracking-[0.32em] text-chant-gold";
const field =
  "w-full rounded-2xl border border-chant-line bg-chant-night/40 px-4 py-3 text-chant-ink outline-none transition placeholder:text-chant-muted focus:border-chant-gold";

function Lines({ items }: { items: string[] }) {
  return (
    <div className="mt-4 space-y-3 leading-relaxed text-chant-ice">
      {items.map((t) => (
        <p key={t}>{t}</p>
      ))}
    </div>
  );
}

function PromessesPage() {
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const d = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setError(null);
    if (!d.name?.trim()) return setError("Merci d'indiquer votre nom.");
    if (!d.phone?.trim() && !d.email?.trim())
      return setError("Merci d'indiquer un téléphone ou un e-mail pour que nous puissions vous recontacter.");
    setSending(true);
    const res = await submitPledge({
      data: {
        name: d.name.trim(),
        honoree: d.honoree?.trim() || undefined,
        phone: d.phone?.trim() || undefined,
        email: d.email?.trim() || undefined,
        schedule: d.schedule?.trim() || undefined,
        intention: d.intention?.trim() || undefined,
      },
    });
    setSending(false);
    if (res.ok) {
      setSent(true);
      form.reset();
    } else {
      setError(res.error);
    }
  };

  return (
    <main className="chants-page min-h-[100dvh] bg-chant-night text-chant-ink">
      <SiteChrome active="promesses" />

      <section className="mx-auto w-full max-w-[1540px] px-4 pb-20 pt-28 sm:px-8 lg:px-12">
        <Reveal>
          <div className={`${panel} flex gap-4 !p-5`}>
            <span className="mt-0.5 text-chant-gold" aria-hidden>◷</span>
            <div className="space-y-1 text-sm text-chant-ice">
              <strong className="text-chant-ink">Promettre aujourd'hui, régler à votre rythme.</strong>
              <p>Aucun paiement n'est demandé à l'inscription.</p>
              <p>Votre promesse peut être honorée à tout moment au cours de l'année, en une ou plusieurs fois.</p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08} className="mt-14 flex flex-col-reverse items-start justify-between gap-10 md:flex-row md:items-center">
          <div>
            <p className={eyebrow}>Campagne de promesses</p>
            <p lang="he" dir="rtl" className="font-hebrew mt-4 text-3xl text-chant-gold">בִּרְכַּת הַשָּׁנָה</p>
            <h1 className="mt-2">Birkat Hachana 5787</h1>
            <p className="mt-5 text-lg text-chant-muted">La bénédiction de l'année, à chaque ouverture du Hekhal</p>
          </div>
          <img src="/__l5e/assets-v1/9c13281d-a737-4807-a0f1-f20b35311edf/logo-hasde-gold.png" alt="Hasdé Tsion, 50 rue du Bois de Boulogne" className="h-auto w-44 max-w-full shrink-0 object-contain md:w-56" />
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <Reveal><section className={panel}><p className={eyebrow}>La Birkat Hachana</p><Lines items={INTRO} /></section></Reveal>
          <Reveal delay={0.1}><section className={panel}><p className={eyebrow}>À chaque ouverture du Hekhal</p><Lines items={ENGAGEMENT} /></section></Reveal>
        </div>

        <Reveal className="mt-8">
          <section className={`${panel} sm:!p-10`} aria-label="Montant du don">
            <p className={eyebrow}>Don pour l'année</p>
            <p className="font-display mt-3 text-[clamp(4rem,11vw,9rem)] font-black leading-none">
              {new Intl.NumberFormat("fr-FR").format(AMOUNT)}<span className="ml-2 text-[0.4em]">€</span>
            </p>
            <p className="mt-3 text-chant-muted">Un don unique pour toute l'année 5787.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                [eur(NET), `Coût réel après réduction d'impôt de ${RATE} %.`],
                [`≈ ${eur(MONTHLY)}`, "Par mois, si vous réglez en douze fois."],
                ["CERFA", "Reçu fiscal adressé pour chaque don."],
              ].map(([b, s]) => (
                <div key={b} className="rounded-2xl border border-chant-line bg-chant-night/40 p-5">
                  <b className="font-display text-2xl text-chant-gold">{b}</b>
                  <p className="mt-1 text-sm text-chant-muted">{s}</p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div className="space-y-5">
            <Reveal>
              <section className={panel} aria-label="Bénédiction">
                <p className={eyebrow}>Bénédiction des donateurs</p>
                <p lang="he" dir="rtl" className="font-hebrew mt-5 text-xl leading-[2.1] text-chant-ink">{BLESSING_HE}</p>
                <details className="mt-4">
                  <summary className="cursor-pointer font-semibold text-chant-gold">Lire la traduction</summary>
                  <p className="mt-3 leading-relaxed text-chant-ice">{BLESSING_FR}</p>
                </details>
              </section>
            </Reveal>
            <Reveal><section className={panel}><p className={eyebrow}>Calendrier</p><Lines items={CALENDAR} /></section></Reveal>
          </div>

          <Reveal delay={0.1} className="lg:sticky lg:top-24">
            <aside className={panel}>
              <form onSubmit={submit} noValidate className="space-y-4">
                <p className={eyebrow}>Ma promesse</p>
                <h2 className="font-display text-3xl font-black">Je m'engage</h2>
                <p className="text-sm text-chant-muted">Quelques informations suffisent.<br />Nous vous recontacterons pour convenir du règlement.</p>
                <div className="flex items-center justify-between rounded-2xl border border-chant-gold/50 bg-chant-night/40 px-4 py-3">
                  <span className="text-sm text-chant-ice">Don Birkat Hachana<br />soit {eur(NET)} après impôt</span>
                  <b className="font-display text-2xl">{eur(AMOUNT)}</b>
                </div>
                {error && <p role="alert" className="rounded-2xl border border-destructive/50 bg-destructive/15 px-4 py-3 text-sm">{error}</p>}
                <label className="block text-sm font-semibold">Nom et prénom<input name="name" autoComplete="name" className={`${field} mt-2`} /></label>
                <label className="block text-sm font-semibold">Nom(s) à citer à l'ouverture du Hekhal
                  <input name="honoree" placeholder="Ex. David ben Sarah et sa famille" className={`${field} mt-2`} />
                  <span className="mt-1 block text-xs font-normal text-chant-muted">De préférence le nom hébraïque, suivi de celui de la mère.</span>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold">Téléphone<input name="phone" type="tel" autoComplete="tel" className={`${field} mt-2`} /></label>
                  <label className="block text-sm font-semibold">E-mail<input name="email" type="email" autoComplete="email" className={`${field} mt-2`} /></label>
                </div>
                <label className="block text-sm font-semibold">Règlement envisagé
                  <select name="schedule" className={`${field} mt-2`}>{SCHEDULES.map((s) => <option key={s} className="bg-chant-night">{s}</option>)}</select>
                </label>
                <label className="block text-sm font-semibold">Intention particulière <span className="font-normal text-chant-muted">· facultatif</span>
                  <textarea name="intention" rows={3} placeholder="Refoua chelema, zivoug, réussite d'un enfant, élévation de l'âme…" className={`${field} mt-2`} />
                </label>
                <button type="submit" disabled={sending} className="w-full rounded-full bg-chant-gold py-3.5 font-bold text-chant-night transition hover:brightness-110 disabled:opacity-60">
                  {sending ? "Enregistrement…" : "Enregistrer ma promesse"}
                </button>
                <p className="text-xs text-chant-muted">Aucune donnée bancaire n'est demandée.<br />Vos informations restent réservées à l'administration de la synagogue.</p>
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-chant-muted"><span className="h-px flex-1 bg-chant-line" />ou<span className="h-px flex-1 bg-chant-line" /></div>
                <a href={HELLOASSO} target="_blank" rel="noopener" className="block w-full rounded-full border border-chant-line py-3.5 text-center font-bold transition hover:border-chant-gold">
                  Régler dès maintenant sur HelloAsso ↗
                </a>
              </form>
            </aside>
          </Reveal>
        </div>

        <footer className="mt-16 flex flex-wrap justify-between gap-3 text-xs text-chant-muted">
          <span>Association Hassidim de Sion · 50 rue du Bois de Boulogne, 92200 Neuilly-sur-Seine</span>
        </footer>
      </section>
    </main>
  );
}
