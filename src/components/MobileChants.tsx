import { Link } from "@tanstack/react-router";
import { ChevronDown, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import songsData from "@/data/chants.json";

type LyricLine = { kind: "he" | "phonetic" | "translation" | "gap"; text: string };
type Song = {
  number: number; hebrew: string; title: string; source: string; rite: string;
  occasions: string[]; occasionKeys: string[]; reference: boolean;
  youtubeUrl: string; spotifyUrl: string; appleMusicUrl: string; lyrics: LyricLine[];
};
const songs = songsData as Song[];
const filters = [["all", "Tous"], ["st", "Sim'hat Torah"], ["souk", "Souccot"], ["shab", "Chabbat"], ["ann", "Toute l'année"]] as const;
const norm = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f\u0591-\u05c7]/g, "").toLowerCase();

export default function MobileChants() {
  const [q, setQ] = useState("");
  const [f, setF] = useState("all");
  const [open, setOpen] = useState<number | null>(null);
  const list = useMemo(() => {
    const n = norm(q.trim());
    return songs.filter((s) => (f === "all" || s.occasionKeys.includes(f)) &&
      (!n || norm([s.title, s.hebrew, s.source, ...s.lyrics.map((l) => l.text)].join(" ")).includes(n)));
  }, [q, f]);

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 rounded-full bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <Search className="h-4 w-4 shrink-0 text-[#1f4ea8]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher une musique, un mot…" className="min-w-0 flex-1 bg-transparent text-[14px] text-foreground outline-none placeholder:text-foreground/40" />
        {q && <button onClick={() => setQ("")} aria-label="Effacer" className="text-foreground/40"><X className="h-4 w-4" /></button>}
      </label>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {filters.map(([v, l]) => (
          <button key={v} onClick={() => setF(v)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold ${f === v ? "btn-blue-animated text-white" : "bg-white text-foreground/60 shadow-[0_2px_8px_rgba(0,0,0,0.05)]"}`}>{l}</button>
        ))}
      </div>
      <p className="px-1 text-[12px] font-semibold text-foreground/50">{list.length} chant{list.length > 1 ? "s" : ""}</p>
      {list.map((s) => {
        const isOpen = open === s.number;
        return (
          <article key={s.number} className="rounded-2xl bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
            <div className="flex items-start justify-between gap-3">
              <span className="text-[12px] font-bold text-[#1f4ea8]">{String(s.number).padStart(2, "0")}</span>
              {s.reference && <span className="rounded-full border border-[#d6b24a]/60 px-2 py-0.5 text-[9px] font-bold uppercase text-[#a8862a]">Référence</span>}
            </div>
            <p lang="he" dir="rtl" className="mt-1 font-hebrew text-[22px] leading-snug text-foreground">{s.hebrew}</p>
            <h3 className="mt-1 font-display text-[16px] font-bold text-foreground">{s.title}</h3>
            <p className="mt-0.5 text-[12px] leading-5 text-foreground/55">{s.source}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {s.youtubeUrl && <a href={s.youtubeUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#ff0000]/10 px-3 py-1.5 text-[12px] font-semibold text-[#d40000]">YouTube</a>}
              {s.spotifyUrl && <a href={s.spotifyUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#1db954]/12 px-3 py-1.5 text-[12px] font-semibold text-[#168d40]">Spotify</a>}
              {s.appleMusicUrl && <a href={s.appleMusicUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#8a5cf6]/10 px-3 py-1.5 text-[12px] font-semibold text-[#6d3fd9]">Apple Music</a>}
              <button onClick={() => setOpen(isOpen ? null : s.number)} className="inline-flex items-center gap-1 rounded-full bg-[#1f4ea8] px-3 py-1.5 text-[12px] font-semibold text-white">
                Paroles <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
            </div>
            {isOpen && (
              <div className="mt-4 space-y-1 border-t border-black/5 pt-4 text-center">
                {s.lyrics.map((l, i) => l.kind === "gap" ? <div key={i} className="h-3" /> :
                  <p key={i} lang={l.kind === "he" ? "he" : "fr"} dir={l.kind === "he" ? "rtl" : "ltr"} className={l.kind === "he" ? "font-hebrew text-[19px] leading-relaxed text-foreground" : l.kind === "phonetic" ? "text-[12px] text-foreground/50" : "mt-3 text-[12px] italic text-foreground/60"}>{l.text}</p>)}
              </div>
            )}
          </article>
        );
      })}
      {!list.length && <p className="rounded-2xl bg-white p-6 text-center text-[13px] text-foreground/50">Aucun chant trouvé.</p>}
      <Link to="/chants" className="block text-center text-[12px] font-semibold text-[#1f4ea8]">Ouvrir le livret complet (karaoké)</Link>
    </div>
  );
}
