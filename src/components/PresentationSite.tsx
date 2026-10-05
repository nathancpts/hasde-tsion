import { useEffect, useState } from "react";
import { fetchLiveWeek, fetchZmanim } from "@/lib/jewish-calendar";

/**
 * Site de présentation (PC ≥ 768 px). Le fichier fourni est affiché tel quel
 * dans un cadre isolé : ses styles, animations et scripts ne touchent jamais
 * le mode TV ni la version téléphone, et tout s'arrête quand on quitte la page.
 */
function minus(hm: string | undefined, n: number) {
  const m = hm?.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return undefined;
  const t = (Number(m[1]) * 60 + Number(m[2]) - n + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

const HEBREW_LABELS: Record<string, string> = {
  "Hatzot Laïla": "חצות לילה",
  "Alot haShahar": "עלות השחר",
  "Misheyakir / Tefilin": "משיכיר",
  "Hanetz haHama": "הנץ החמה",
  "Limite Shema M\"A": "סוף זמן שמע מג״א",
  "Limite Shema GR\"A": "סוף זמן שמע גר״א",
  "Limite Tefila M\"A": "סוף זמן תפילה מג״א",
  "Limite Tefila GR\"A": "סוף זמן תפילה גר״א",
  Hatzot: "חצות",
  "Minha Guedola": "מנחה גדולה",
  Minha: "מנחה",
  "Plag haMinha": "פלג המנחה",
  Sheqyia: "שקיעה",
  "Sortie des étoiles": "צאת הכוכבים",
  "Nuit de R. Tam": "רבנו תם",
};

function eventKind(label: string) {
  return /minha|chah|arvit/i.test(label) ? "Office" : /chabbat|bougies|entrée|sortie/i.test(label) ? "Chabbat" : "Zman";
}

export function PresentationSite() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let done = false;
    const go = () => { if (!done) { done = true; setReady(true); } };
    const timer = setTimeout(go, 3000);
    const today = new Date();
    Promise.all([fetchZmanim(today), today.getDay() === 5 ? fetchLiveWeek(today).catch(() => null) : Promise.resolve(null)])
      .then(([z, w]) => {
        const get = (l: string) => z.times.find((t) => t.label === l)?.value;
        const sunset = get("Sheqyia");
        (window as unknown as { __HT_LIVE__?: unknown }).__HT_LIVE__ = {
          events: z.times.map((time) => ({
            k: eventKind(time.label),
            n: time.label,
            he: HEBREW_LABELS[time.label] ?? "",
            t: time.value,
          })),
          sunrise: get("Hanetz haHama"),
          sunset,
          minha: minus(sunset, 40),
          arvit: get("Sortie des étoiles"),
          rtam: get("Nuit de R. Tam"),
          candles: today.getDay() === 5 ? (w?.vendredi.candleLighting || minus(sunset, 18)) : undefined,
        };
      })
      .catch(() => {})
      .finally(go);
    return () => { clearTimeout(timer); done = true; };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#050d20", zIndex: 40 }}>
      {ready && (
        <iframe
          src={"/presentation.html" + (typeof window !== "undefined" ? window.location.hash : "")}
          title="Hasdé Tsion"
          style={{ border: 0, width: "100%", height: "100%", display: "block" }}
        />
      )}
    </div>
  );
}
