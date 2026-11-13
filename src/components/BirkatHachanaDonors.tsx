// Donateurs annuels Birkat Hachana 5787 — noms seuls (jamais de téléphone ni d'e-mail).
const DONORS = [
  "Jonathan Sebbag",
  "Sidney Broutinovski",
  "Bruno Cohen",
  "Raphaël Niddam",
  "Rudy Setti",
  "Julien Seknagi",
  "Gaon Niddam",
  "Avram Niddam",
];

export default function BirkatHachanaDonors() {
  return (
    <div className="space-y-3">
      <article
        className="btn-blue-animated rounded-3xl p-5 text-center"
        style={{ boxShadow: "0 8px 24px rgba(31,78,168,0.25)" }}
      >
        <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-white/80 mb-1">
          Birkat Hachana 5787
        </p>
        <h3 className="font-display text-2xl font-bold text-white leading-tight">
          Nos donateurs annuels
        </h3>
        <p className="text-[12px] text-white/85 mt-1">Qu'Hachem les bénisse tout au long de l'année ✨</p>
      </article>

      <article className="rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <ul className="divide-y divide-[var(--blue-soft)]">
          {DONORS.map((name) => (
            <li key={name} className="flex items-center gap-3 py-2.5">
              <span className="text-[#1f4ea8] text-[12px]">✦</span>
              <span className="font-display text-[15px] font-semibold text-foreground">{name}</span>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}
