import { useEffect, useRef, useState } from "react";

const STREAM_URL = "/api/public/kotel";

/**
 * Live Jérusalem (EarthCam) relayé par notre serveur.
 * Lecture HLS sans aucun contrôle ni interaction possible.
 */
export default function KotelLive({
  className = "",
  radius = 0,
}: {
  className?: string;
  radius?: number;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<"loading" | "playing" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let destroyed = false;
    let hls: { destroy: () => void } | null = null;
    let retryTimer: number | null = null;
    let lastTime = -1;
    let stalledChecks = 0;

    const play = () => void video.play().catch(() => {});
    const retry = () => {
      if (destroyed || retryTimer !== null) return;
      setStatus("loading");
      retryTimer = window.setTimeout(() => {
        retryTimer = null;
        if (!destroyed) setAttempt((value) => value + 1);
      }, 5000);
    };
    const onPlaying = () => {
      stalledChecks = 0;
      setStatus("playing");
    };
    const onPlaybackProblem = () => retry();
    video.addEventListener("playing", onPlaying);
    video.addEventListener("error", onPlaybackProblem);
    video.addEventListener("stalled", onPlaybackProblem);

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = STREAM_URL;
      play();
    } else {
      void (async () => {
        const { default: Hls } = await import("hls.js");
        if (destroyed || !Hls.isSupported()) {
          if (!destroyed) setStatus("error");
          return;
        }
        const inst = new Hls({ liveDurationInfinity: true, lowLatencyMode: true });
        hls = inst;
        inst.loadSource(STREAM_URL);
        inst.attachMedia(video);
        inst.on(Hls.Events.MANIFEST_PARSED, play);
        inst.on(Hls.Events.ERROR, (_e, data) => {
          if (!data.fatal) return;
          inst.destroy();
          hls = null;
          if (destroyed) return;
          setStatus("error");
          retry();
        });
      })();
    }

    // Certaines TV ne signalent pas une coupure HLS : on vérifie que l'image avance réellement.
    const watchdog = window.setInterval(() => {
      if (video.paused) {
        play();
        return;
      }
      if (video.readyState < 2 || video.currentTime === lastTime) stalledChecks += 1;
      else stalledChecks = 0;
      lastTime = video.currentTime;
      if (stalledChecks >= 3) retry();
    }, 7000);

    return () => {
      destroyed = true;
      window.clearInterval(watchdog);
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("error", onPlaybackProblem);
      video.removeEventListener("stalled", onPlaybackProblem);
      hls?.destroy();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [attempt]);

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
      {status !== "playing" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0b1c3a] text-white/70 text-[12px] tracking-wide">
          {status === "error" ? "Live momentanément indisponible" : "Connexion au live…"}
        </div>
      )}
    </div>
  );
}
