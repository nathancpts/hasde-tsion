import { useEffect, useMemo, useState } from "react";

type MobileSkyProps = {
  sunrise: string;
  sunset: string;
  dayLabel: string;
  dateLabel: string;
  nextEvent?: { label: string; remaining: string } | null;
};

const parseMinutes = (value: string, fallback: number) => {
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : fallback;
};

const weatherLabel = (code: number) => {
  if (code >= 95) return "Orage";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Neige";
  if ([51, 53, 55, 56, 57].includes(code)) return "Bruine";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Pluie";
  if ([45, 48].includes(code)) return "Brouillard";
  if (code === 3) return "Couvert";
  if (code >= 1) return "Partiellement nuageux";
  return "Ensoleillé";
};

export function MobileSky({ sunrise, sunset, dayLabel, dateLabel, nextEvent }: MobileSkyProps) {
  const [now, setNow] = useState<Date | null>(null);
  const [weather, setWeather] = useState<{ code: number; temperature: number | null; cloudCover: number } | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let active = true;
    const load = () => {
      fetch("https://api.open-meteo.com/v1/forecast?latitude=48.885&longitude=2.269&current=weather_code,cloud_cover,temperature_2m&timezone=Europe%2FParis")
        .then((response) => response.json())
        .then((data) => {
          if (!active || !data.current) return;
          setWeather({
            code: Number(data.current.weather_code ?? 0),
            temperature: typeof data.current.temperature_2m === "number" ? data.current.temperature_2m : null,
            cloudCover: Number(data.current.cloud_cover ?? 0),
          });
        })
        .catch(() => undefined);
    };
    load();
    const id = window.setInterval(load, 30 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

  const scene = useMemo(() => {
    const sunriseMinutes = parseMinutes(sunrise, 7 * 60 + 30);
    const sunsetMinutes = parseMinutes(sunset, 19 * 60 + 30);
    const currentMinutes = now ? now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60 : sunriseMinutes;
    const progress = Math.max(0, Math.min(1, (currentMinutes - sunriseMinutes) / Math.max(1, sunsetMinutes - sunriseMinutes)));
    const sunUp = currentMinutes >= sunriseMinutes && currentMinutes <= sunsetMinutes;
    const x = 8 + progress * 84;
    const y = 76 - Math.sin(Math.PI * progress) * 54;
    const dawnDistance = Math.abs(currentMinutes - sunriseMinutes);
    const duskDistance = Math.abs(currentMinutes - sunsetMinutes);
    const twilight = Math.min(dawnDistance, duskDistance) < 55;
    return { sunUp, x, y, twilight, currentMinutes };
  }, [now, sunrise, sunset]);

  const clouds = weather ? Math.max(2, Math.min(7, Math.round(weather.cloudCover / 18))) : 3;
  const isRain = weather ? [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(weather.code) : false;
  const isSnow = weather ? [71, 73, 75, 77, 85, 86].includes(weather.code) : false;

  return (
    <section className={`mobile-sky ${scene.sunUp ? (scene.twilight ? "mobile-sky--twilight" : "mobile-sky--day") : "mobile-sky--night"}`} aria-label="Ciel et météo en direct à Neuilly-sur-Seine">
      <div className="mobile-sky__stars" aria-hidden="true" />
      <div className="mobile-sky__arc" aria-hidden="true" />

      {scene.sunUp ? (
        <div className="mobile-sky__sun" aria-hidden="true" style={{ left: `${scene.x}%`, top: `${scene.y}%` }}>
          <span />
        </div>
      ) : (
        <div className="mobile-sky__moon" aria-hidden="true" />
      )}

      <div className="mobile-sky__clouds" aria-hidden="true">
        {Array.from({ length: clouds }, (_, index) => (
          <i key={index} style={{ "--cloud-index": index } as React.CSSProperties} />
        ))}
      </div>

      {isRain && <div className="mobile-sky__rain" aria-hidden="true" />}
      {isSnow && <div className="mobile-sky__snow" aria-hidden="true" />}

      <div className="mobile-sky__status">
        <p>{dayLabel}</p>
        <strong>{dateLabel}</strong>
        <span>
          {now?.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) ?? "--:--"}
          {weather ? ` · ${weatherLabel(weather.code)}${weather.temperature == null ? "" : ` · ${Math.round(weather.temperature)} °C`}` : ""}
        </span>
      </div>

      {nextEvent && (
        <div className="mobile-sky__next">
          <span>Prochain</span>
          <strong>{nextEvent.label}</strong>
          <small>· {nextEvent.remaining}</small>
        </div>
      )}
    </section>
  );
}