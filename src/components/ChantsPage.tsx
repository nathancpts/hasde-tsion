import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  FileDown,
  Minus,
  Music2,
  Pause,
  Play,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SiteChrome } from "@/components/SiteChrome";
import songsData from "@/data/chants.json";
import bookletAsset from "@/assets/livret-chants-simhat-torah.pdf.asset.json";

type LyricLine = { kind: "he" | "phonetic" | "translation" | "gap"; text: string };
type Song = {
  number: number;
  hebrew: string;
  title: string;
  source: string;
  rite: string;
  riteKey: string;
  occasions: string[];
  occasionKeys: string[];
  reference: boolean;
  complete: boolean;
  youtubeUrl: string;
  youtubeId: string;
  spotifyUrl: string;
  spotifyId: string;
  appleMusicUrl: string;
  lyrics: LyricLine[];
};

const songs = songsData as Song[];
const occasions = [
  ["all", "Tous"],
  ["st", "Sim'hat Torah"],
  ["souk", "Souccot"],
  ["shab", "Chabbat"],
  ["ann", "Toute l'année"],
] as const;
const rites = [
  ["all", "Tous les rites"],
  ["maroc", "Maroc"],
  ["bagdad", "Bagdad"],
  ["libye", "Libye — Tripoli"],
  ["eretz", "Terre d'Israël"],
  ["commun", "Commun séfarade"],
  ["contemp", "Contemporain"],
] as const;
const albumTracks = [
  ["גַּלֵּה גַּלֵּה", "Galé Galé", "texte à sourcer"],
  ["אֲשׁוֹרֵר שִׁירָה", "Ashorer Shira", "n° 01 du livret"],
  ["אַשְׁרֵיכֶם יִשְׂרָאֵל", "Ashrékhem Yisrael", "texte à sourcer"],
  ["אַדִּיר כְּבוֹדוֹ", "Adir Kevodo", "texte à sourcer"],
  ["מִפִּי אֵ-ל", "Mipi El", "n° 03 du livret"],
  ["אֲרוֹמִמְךָ לִכְבוֹד שְׁמֶךָ", "Aromimkha Likhvod Shemékha", "texte à sourcer"],
  ["הַלְלוּ-יָהּ הַלְלוּ עַבְדֵי ה'", "Halelou-Ka Halelou Avdé Hashem", "écouter"],
  ["חַי חַי יוֹדוּ חַי", "'Haï 'Haï Yodou 'Haï", "texte à sourcer"],
  ["יוֹם שִׂמְחָה לְיִשְׂרָאֵל", "Yom Sim'ha LeYisrael", "texte à sourcer"],
  ["כִּירִי רָם", "Kiri Ram", "texte à sourcer"],
  ["אֵלִי אֵלִי לָמָּה", "Eli Eli Lama", "texte à sourcer"],
  ["אֵ-ל יִבְנֶה הַר גָּלִיל", "Kel Yivné Har Galil", "texte à sourcer"],
] as const;

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f\u0591-\u05c7]/g, "").toLowerCase();
}

export function ChantsPage() {
  const [query, setQuery] = useState("");
  const [occasion, setOccasion] = useState("all");
  const [rite, setRite] = useState("all");
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [media, setMedia] = useState<"youtube" | "spotify">("youtube");
  const [showPhonetics, setShowPhonetics] = useState(true);
  const [lyricSize, setLyricSize] = useState(26);
  const dialogRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const needle = normalize(query.trim());
    return songs.filter((song) => {
      if (occasion !== "all" && !song.occasionKeys.includes(occasion)) return false;
      if (rite !== "all" && song.riteKey !== rite) return false;
      if (!needle) return true;
      return normalize([song.title, song.hebrew, song.source, ...song.lyrics.map((line) => line.text)].join(" ")).includes(needle);
    });
  }, [query, occasion, rite]);

  useEffect(() => {
    if (!activeSong) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => event.key === "Escape" && setActiveSong(null);
    document.addEventListener("keydown", close);
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", close);
    };
  }, [activeSong]);

  const openSong = (song: Song) => {
    setMedia(song.youtubeId ? "youtube" : "spotify");
    setActiveSong(song);
  };

  return (
    <main className="chants-page min-h-[100dvh] bg-chant-night text-chant-ink">
      <SiteChrome />

      <section className="mx-auto max-w-7xl px-4 pb-12 pt-32 sm:px-8 lg:px-12 lg:pt-40">
        <p className="text-xs font-bold uppercase tracking-[0.26em] text-chant-gold">Hasdé Tsion · 5787 — 2026</p>
        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <p lang="he" dir="rtl" className="font-hebrew text-3xl text-chant-ice sm:text-5xl">שִׂמְחַת תּוֹרָה</p>
            <h1 className="mt-2 font-display text-4xl font-black sm:text-6xl">Chants &amp; piyoutim</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-chant-muted">Les 43 chants de la soirée, avec paroles hébraïques, phonétique, mélodies et mode karaoké.</p>
          </div>
          <Button asChild className="h-12 bg-chant-gold px-5 text-chant-night">
            <a href={bookletAsset.url} download><FileDown /> Télécharger le livret</a>
          </Button>
        </div>
      </section>

      <section className="sticky top-0 z-20 border-y border-chant-line bg-chant-night/95 px-4 py-4 backdrop-blur-xl sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl space-y-3">
          <label className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border border-chant-line bg-chant-panel px-4 py-3">
            <Search className="size-5 text-chant-gold" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Chercher un chant, un auteur, un mot…" className="min-w-0 bg-transparent text-sm text-chant-ink outline-none placeholder:text-chant-muted" />
            {query && <Button size="icon" variant="ghost" onClick={() => setQuery("")} aria-label="Effacer la recherche" className="text-chant-muted"><X /></Button>}
          </label>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {occasions.map(([value, label]) => (
              <Button key={value} size="sm" variant="ghost" onClick={() => setOccasion(value)} className={occasion === value ? "shrink-0 bg-chant-gold text-chant-night" : "shrink-0 border border-chant-line text-chant-muted"}>
                {label}{value === "all" ? ` · ${songs.length}` : ` · ${songs.filter((song) => song.occasionKeys.includes(value)).length}`}
              </Button>
            ))}
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {rites.map(([value, label]) => (
              <Button key={value} size="sm" variant="ghost" onClick={() => setRite(value)} className={rite === value ? "shrink-0 bg-chant-accent text-chant-ink" : "shrink-0 border border-chant-line text-chant-muted"}>
                {label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-8 lg:px-12">
        <p className="mb-5 text-sm font-semibold text-chant-muted">{filtered.length} chant{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}</p>
        {filtered.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((song) => (
              <article key={song.number} className="flex min-h-80 flex-col border border-chant-line bg-chant-panel p-5 transition-colors hover:border-chant-gold/70">
                <div className="flex items-start justify-between gap-4">
                  <span className="font-display text-sm font-bold text-chant-gold">{String(song.number).padStart(2, "0")}</span>
                  {song.reference && <span className="border border-chant-gold/50 px-2 py-1 text-[10px] font-bold uppercase text-chant-gold">Référence</span>}
                </div>
                <h2 lang="he" dir="rtl" className="mt-5 font-hebrew text-2xl leading-relaxed text-chant-ink">{song.hebrew}</h2>
                <h3 className="mt-2 font-display text-lg font-bold">{song.title}</h3>
                <p className="mt-2 text-sm leading-6 text-chant-muted">{song.source}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {song.occasions.map((item) => <span key={item} className="border border-chant-line px-2 py-1 text-[10px] font-semibold text-chant-ice">{item}</span>)}
                  <span className="border border-chant-line px-2 py-1 text-[10px] font-semibold text-chant-muted">{song.rite}</span>
                </div>
                <div className="mt-auto grid grid-cols-[minmax(0,1fr)_auto] gap-2 pt-6">
                  <Button onClick={() => openSong(song)} className="bg-chant-gold text-chant-night"><Play /> Karaoké</Button>
                  <Button asChild variant="ghost" size="icon" className="border border-chant-line text-chant-ink">
                    <a href={song.youtubeUrl || song.spotifyUrl} target="_blank" rel="noopener noreferrer" aria-label={`Écouter ${song.title}`}><ExternalLink /></a>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="border border-chant-line bg-chant-panel p-12 text-center text-chant-muted">Aucun chant ne correspond. Essayez un autre mot ou retirez les filtres.</div>
        )}
      </section>

      {!query && occasion === "all" && rite === "all" && (
        <>
          <section className="mx-auto max-w-7xl px-4 py-12 sm:px-8 lg:px-12">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-chant-gold">L’album de référence</p>
            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <a href="https://open.spotify.com/album/0YMxiRwIBatPVxFcCqiqh7" target="_blank" rel="noopener noreferrer" className="block border border-chant-accent bg-chant-panel p-5">
                  <strong className="block font-display text-lg">שמחת תורה — Hibbat HaPiyut (2022)</strong>
                  <span className="mt-2 block text-sm leading-6 text-chant-ice">Les 12 piyoutim de Sim'hat Torah dans leur mélodie traditionnelle. L'album de référence pour apprendre les airs avant la fête.</span>
                </a>
                <iframe title="Album Sim'hat Torah — Hibbat HaPiyut" src="https://open.spotify.com/embed/album/0YMxiRwIBatPVxFcCqiqh7" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" className="h-[380px] w-full border-0" />
              </div>
              <div className="divide-y divide-chant-line border-y border-chant-line">
                {albumTracks.map(([hebrew, title, note], index) => (
                  <div key={title} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 px-1 py-3">
                    <span className="row-span-2 font-display text-xs font-bold text-chant-accent">{String(index + 1).padStart(2, "0")}</span>
                    <div className="min-w-0"><span lang="he" dir="rtl" className="font-hebrew text-lg">{hebrew}</span> <span className="ml-2 text-xs text-chant-muted">{title}</span></div>
                    <span className="mt-1 w-fit border border-chant-line px-2 py-0.5 text-[10px] text-chant-muted">{note}</span>
                  </div>
                ))}
                <p className="py-4 text-center text-xs italic leading-5 text-chant-muted">Les textes non encore repris au livret seront établis sur une source imprimée avant d’être ajoutés.</p>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-8 lg:px-12">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-chant-gold">Où écouter les mélodies</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <a href="https://www.youtube.com/@hibbathapiyut" target="_blank" rel="noopener noreferrer" className="border border-chant-line bg-chant-panel p-6 transition-colors hover:border-chant-gold"><Music2 className="text-chant-gold" /><strong className="mt-5 block font-display text-xl">La chaîne Hibat HaPiyut</strong><span className="mt-2 block text-sm text-chant-muted">Les piyoutim dans leur mélodie traditionnelle, texte hébreu à l’écran.</span></a>
              <a href="https://web.nli.org.il/sites/nlis/he/song" target="_blank" rel="noopener noreferrer" className="border border-chant-line bg-chant-panel p-6 transition-colors hover:border-chant-gold"><BookOpen className="text-chant-gold" /><strong className="mt-5 block font-display text-xl">Les piyoutim classés par rite</strong><span className="mt-2 block text-sm text-chant-muted">Maroc, Tunisie, Djerba, Bagdad… Bibliothèque nationale d’Israël.</span></a>
            </div>
          </section>
        </>
      )}

      {activeSong && (
        <div className="fixed inset-0 z-50 bg-chant-night/95 p-3 backdrop-blur-xl sm:p-6" role="dialog" aria-modal="true" aria-label={`Karaoké — ${activeSong.title}`}>
          <div ref={dialogRef} tabIndex={-1} className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden border border-chant-line bg-chant-night outline-none">
            <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-chant-line p-4">
              <span className="font-display text-sm font-bold text-chant-gold">{String(activeSong.number).padStart(2, "0")}</span>
              <div className="min-w-0"><p className="truncate font-display font-bold">{activeSong.title}</p><p lang="he" dir="rtl" className="truncate font-hebrew text-chant-muted">{activeSong.hebrew}</p></div>
              <Button variant="ghost" size="icon" onClick={() => setActiveSong(null)} aria-label="Fermer" className="border border-chant-line text-chant-ink"><X /></Button>
            </header>
            <div className="no-scrollbar flex-1 overflow-y-auto">
              <div className="mx-auto max-w-4xl p-4 sm:p-7">
                {(activeSong.youtubeId || activeSong.spotifyId) && (
                  <div className="mb-6">
                    <div className="mb-3 flex flex-wrap gap-2">
                      {activeSong.youtubeId && <Button size="sm" variant="ghost" onClick={() => setMedia("youtube")} className={media === "youtube" ? "bg-chant-gold text-chant-night" : "border border-chant-line text-chant-ink"}>YouTube</Button>}
                      {activeSong.spotifyId && <Button size="sm" variant="ghost" onClick={() => setMedia("spotify")} className={media === "spotify" ? "bg-chant-gold text-chant-night" : "border border-chant-line text-chant-ink"}>Spotify</Button>}
                      <Button asChild size="sm" variant="ghost" className="border border-chant-line text-chant-ink"><a href={activeSong.appleMusicUrl} target="_blank" rel="noopener noreferrer">Apple Music <ExternalLink /></a></Button>
                    </div>
                    {media === "youtube" && activeSong.youtubeId ? (
                      <iframe title={`Écouter ${activeSong.title}`} src={`https://www.youtube.com/embed/${activeSong.youtubeId}?playsinline=1&rel=0`} allow="encrypted-media; picture-in-picture" allowFullScreen className="aspect-video w-full border-0 bg-chant-panel" />
                    ) : activeSong.spotifyId ? (
                      <iframe title={`Écouter ${activeSong.title} sur Spotify`} src={`https://open.spotify.com/embed/track/${activeSong.spotifyId}`} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" className="h-[152px] w-full border-0" />
                    ) : null}
                  </div>
                )}
                {!activeSong.youtubeId && !activeSong.spotifyId && <p className="mb-6 border border-chant-line bg-chant-panel p-4 text-sm text-chant-muted">Pas encore d’enregistrement attaché à ce chant — les paroles restent disponibles.</p>}
                <div className="space-y-1 text-center" style={{ fontSize: lyricSize }}>
                  {activeSong.lyrics.map((line, index) => {
                    if (line.kind === "gap") return <div key={index} className="h-5" />;
                    if (line.kind === "phonetic" && !showPhonetics) return null;
                    return <p key={index} lang={line.kind === "he" ? "he" : "fr"} dir={line.kind === "he" ? "rtl" : "ltr"} className={line.kind === "he" ? "font-hebrew leading-[1.65] text-chant-ink" : line.kind === "phonetic" ? "text-[.62em] leading-[1.7] text-chant-muted" : "mt-8 border-t border-chant-line pt-6 text-[.55em] italic leading-6 text-chant-ice"}>{line.text}</p>;
                  })}
                </div>
              </div>
            </div>
            <footer className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-chant-line bg-chant-panel p-3">
              <Button variant="ghost" onClick={() => setShowPhonetics((value) => !value)} className={showPhonetics ? "justify-self-start bg-chant-accent text-chant-ink" : "justify-self-start border border-chant-line text-chant-muted"}>Phonétique</Button>
              <div className="flex items-center gap-2"><Button size="icon" variant="ghost" onClick={() => setLyricSize((value) => Math.max(16, value - 2))} aria-label="Réduire le texte" className="border border-chant-line text-chant-ink"><Minus /></Button><span className="w-8 text-center text-xs text-chant-muted">{lyricSize}</span><Button size="icon" variant="ghost" onClick={() => setLyricSize((value) => Math.min(48, value + 2))} aria-label="Agrandir le texte" className="border border-chant-line text-chant-ink"><Plus /></Button></div>
            </footer>
          </div>
        </div>
      )}
    </main>
  );
}