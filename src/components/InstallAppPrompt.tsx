import { useEffect, useState } from "react";

type Platform = "ios" | "android" | "other";

function detectPlatform(): Platform {
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document);
  if (isIOS) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

const DISMISS_KEY = "ht-install-dismissed";
const NOTIF_KEY = "ht-notif-asked";

function sendTestNotification() {
  if (!("Notification" in window) || Notification.permission !== "granted") return false;
  try {
    new Notification("Hasdé Tsion 🕍", {
      body: "Notification test : tout fonctionne ! Vous recevrez les horaires et annonces ici.",
      icon: "/app-icon.png",
      badge: "/app-icon.png",
    });
    return true;
  } catch {
    return false;
  }
}

export function InstallAppPrompt() {
  const [mode, setMode] = useState<"none" | "install" | "notif">("none");
  const [platform, setPlatform] = useState<Platform>("other");
  const [notifState, setNotifState] = useState<
    "idle" | "granted" | "denied" | "new-tab" | "unsupported"
  >("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const inIframe = window.top !== window.self;
    const p = detectPlatform();
    setPlatform(p);

    const timer = window.setTimeout(() => {
      if (isStandalone()) {
        // App installée : demander l'autorisation des notifications
        if (
          "Notification" in window &&
          Notification.permission === "default" &&
          !localStorage.getItem(NOTIF_KEY)
        ) {
          setMode("notif");
        }
        return;
      }
      // Navigateur : proposer l'installation (pas dans l'aperçu en iframe)
      if (!inIframe && p !== "other" && !localStorage.getItem(DISMISS_KEY)) {
        setMode("install");
      }
    }, 1500);

    return () => window.clearTimeout(timer);
  }, []);

  if (mode === "none") return null;

  const close = () => {
    if (mode === "install") localStorage.setItem(DISMISS_KEY, "1");
    if (mode === "notif") localStorage.setItem(NOTIF_KEY, "1");
    setMode("none");
  };

  const askNotifications = async () => {
    if (!("Notification" in window)) {
      setNotifState("unsupported");
      return;
    }
    if (window.top !== window.self) {
      setNotifState("new-tab");
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        setNotifState("granted");
        localStorage.setItem(NOTIF_KEY, "1");
        sendTestNotification();
        window.setTimeout(() => setMode("none"), 1600);
      } else {
        setNotifState("denied");
      }
    } catch {
      setNotifState("new-tab");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center px-3 pb-3">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={close}
        aria-hidden
      />
      <div
        className="relative w-full max-w-[440px] rounded-3xl bg-white p-5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={close}
          aria-label="Fermer"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-lg leading-none text-slate-500"
        >
          ×
        </button>

        {mode === "install" ? (
          <>
            <div className="flex items-center gap-3">
              <img src="/app-icon.png" alt="" className="h-12 w-12 rounded-2xl shadow-sm" />
              <div>
                <h2 className="font-display text-[17px] font-semibold text-slate-900">
                  Installer Hasdé Tsion
                </h2>
                <p className="text-[12px] text-slate-500">
                  Accès rapide aux horaires, comme une vraie application.
                </p>
              </div>
            </div>

            <ol className="mt-4 space-y-3 text-[14px] text-slate-700">
              {platform === "ios" ? (
                <>
                  <li className="flex gap-3">
                    <span className="font-semibold text-[#0F3D7A]">1.</span>
                    <span>
                      En bas de Safari, touchez le bouton <strong>Partager</strong> (le carré avec
                      une flèche vers le haut).
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-[#0F3D7A]">2.</span>
                    <span>
                      Faites défiler et choisissez <strong>« Sur l'écran d'accueil »</strong>.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-[#0F3D7A]">3.</span>
                    <span>
                      Touchez <strong>Ajouter</strong> : l'icône apparaît sur votre écran d'accueil.
                    </span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex gap-3">
                    <span className="font-semibold text-[#0F3D7A]">1.</span>
                    <span>
                      En haut à droite de Chrome, touchez le menu <strong>⋮</strong>.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-[#0F3D7A]">2.</span>
                    <span>
                      Choisissez <strong>« Installer l'application »</strong> ou{" "}
                      <strong>« Ajouter à l'écran d'accueil »</strong>.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-[#0F3D7A]">3.</span>
                    <span>
                      Confirmez avec <strong>Installer</strong>.
                    </span>
                  </li>
                </>
              )}
            </ol>

            <button
              onClick={close}
              className="btn-blue-animated mt-5 flex min-h-[52px] w-full items-center justify-center rounded-2xl px-5 text-[15px] font-display font-semibold text-white active:scale-[0.97] transition-all"
            >
              J'ai compris
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0F3D7A]/10 text-2xl">
                🔔
              </div>
              <div>
                <h2 className="font-display text-[17px] font-semibold text-slate-900">
                  Activer les notifications
                </h2>
                <p className="text-[12px] text-slate-500">
                  Recevez les horaires du Chabbat et les annonces de la communauté.
                </p>
              </div>
            </div>

            {notifState === "granted" && (
              <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
                Notifications activées, merci ! Une notification test vient de vous être envoyée.
              </p>
            )}
            {notifState === "denied" && (
              <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
                Les notifications sont bloquées. Vous pouvez les réactiver dans les réglages de
                votre téléphone, à la rubrique de cette application.
              </p>
            )}
            {notifState === "new-tab" && (
              <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
                Ouvrez le site dans son propre onglet (ou depuis l'application installée) pour
                autoriser les notifications.
              </p>
            )}
            {notifState === "unsupported" && (
              <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-[13px] text-slate-600">
                Votre téléphone ne prend pas en charge les notifications ici.
              </p>
            )}

            <button
              onClick={askNotifications}
              className="btn-blue-animated mt-5 flex min-h-[52px] w-full items-center justify-center rounded-2xl px-5 text-[15px] font-display font-semibold text-white active:scale-[0.97] transition-all"
            >
              Autoriser les notifications
            </button>
            <button
              onClick={close}
              className="mt-2 w-full py-2 text-[13px] text-slate-500"
            >
              Plus tard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
