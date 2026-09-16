import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getKotelStreamUrl } from "@/lib/earthcam.functions";

/**
 * Live Jérusalem (EarthCam) — lecture HLS sans aucune interaction possible.
 * Aucun contrôle, aucune info externe, relance automatique.
 */
export default function KotelLive({
  className = "",
  radius = 0,
}: {
  className?: string;
  radius?: number;
}) {
  const fetchUrl = useServerFn(getKotelStreamUrl);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  // Récupération (et rafraîchissement) de l'URL du flux
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetchUrl({});
        if (alive) {
          setSrc(r.url ?? null);
          setFailed(!r.url);
        }
      } catch {
        if (alive) setFailed(true);
      }
    };
    load();
    const id = setInterval(load, 4 * 60 * 1000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [fetchUrl]);

  // Attache le flux HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    let destroyed = false;
    let hls: { destroy: () => void } | null = null;

    const play = () => void video.play().catch(() => {});

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      play();
    } else {
      void (async () => {
        const mod = await import("hls.js");
        const Hls = mod.default;
        if (destroyed || !Hls.isSupported()) return;
        const inst = new Hls({ lowLatencyMode: true, liveDurationInfinity: true });
        hls = inst;
        inst.loadSource(src);
        inst.attachMedia(video);
        inst.on(Hls.Events.MANIFEST_PARSED, play);
        inst.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) {
            inst.destroy();
            hls = null;
            if (!destroyed) setFailed(true);
          }
        });
      })();
    }

    return () => {
      destroyed = true;
      hls?.destroy();
      video.removeAttribute("src");
    };
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ borderRadius: radius || undefined }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        disablePictureInPicture
        controls={false}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ borderRadius: radius || undefined, background: "#0b1c3a" }}
        tabIndex={-1}
        aria-label="Live Jérusalem"
      />
      {/* Bouclier : aucune interaction possible */}
      <div
        className="absolute inset-0 z-10"
        style={{ touchAction: "none" }}
        onClick={(e) => e.preventDefault()}
        onTouchStart={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
        aria-hidden="true"
      />
      {(!src || failed) && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0b1c3a] text-white/70 text-[12px] tracking-wide">
          {failed ? "Live momentanément indisponible" : "Connexion au live…"}
        </div>
      )}
    </div>
  );
}
