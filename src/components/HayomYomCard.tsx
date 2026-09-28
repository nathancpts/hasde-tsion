import { Link } from "@tanstack/react-router";
import type { HayomYomDay } from "@/lib/hayom-yom";

export function HayomYomCard({ content }: { content: HayomYomDay | null }) {
  if (!content) return null;
  const preview = content.fr.split(/\n+/).find(Boolean) ?? content.fr;

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
      <div className="btn-blue-animated px-5 py-4 text-white">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/80">Aujourd’hui, c’est le jour…</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <h3 className="font-display text-xl font-bold">Hayom Yom</h3>
          <span className="text-[11px] font-medium text-white/80">{content.hebrewDate}</span>
        </div>
      </div>
      <div className="p-5">
        <p className="line-clamp-5 text-sm leading-relaxed text-foreground">{preview}</p>
        <Link to="/hayom-yom" className="btn-cta btn-blue-animated mt-4 w-full text-white">
          Lire l’enseignement du jour
        </Link>
      </div>
    </article>
  );
}
