import { useEffect, useState } from "react";

import { registerServiceWorker, subscribeToPush } from "@/lib/push";


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

/** Le rappel d'installation revient chaque jour tant que l'app n'est pas installée. */
const SNOOZE_MS = 24 * 60 * 60 * 1000;

function isSnoozed(key: string): boolean {
  const v = localStorage.getItem(key);
  if (!v) return false;
  const ts = Number(v);
  if (!Number.isFinite(ts) || ts === 1) {
    // ancienne valeur "1" : on la convertit en horodatage
    localStorage.setItem(key, String(Date.now()));
    return true;
  }
  return Date.now() - ts < SNOOZE_MS;
}

function snooze(key: string) {
  localStorage.setItem(key, String(Date.now()));
}

function isIOSSafari(): boolean {
  const ua = navigator.userAgent || "";
  return !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
}

async function sendThankYouNotification() {
  if (!("Notification" in window) || Notification.permission !== "granted") return false;
  const body =
    "Merci d'avoir activé les notifications ! Vous recevrez ici les horaires et annonces de la communauté.";
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.showNotification("Hasdé Tsion 🕍", {
        body,
        icon: "/app-icon-192.png",
        badge: "/app-icon-192.png",
      });
      return true;
    }
    new Notification("Hasdé Tsion 🕍", { body, icon: "/app-icon-192.png", badge: "/app-icon-192.png" });
    return true;
  } catch {
    return false;
  }
}


export function InstallAppPrompt() {
  const [mode, setMode] = useState<"none" | "install" | "notif">("none");
  const [platform, setPlatform] = useState<Platform>("other");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installing, setInstalling] = useState(false);
  const [notifState, setNotifState] = useState<
    "idle" | "granted" | "denied" | "new-tab" | "unsupported"
  >("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const inIframe = window.top !== window.self;
    const p = detectPlatform();
    setPlatform(p);

    // Service worker + resynchronisation de l'abonnement si déjà autorisé
    void (async () => {
      await registerServiceWorker();
      if ("Notification" in window && Notification.permission === "granted") {
        await subscribeToPush();
      }
    })();

    // Android / Chrome : installation directe
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandalone() && !inIframe && localStorage.getItem("ht-installed") !== "1") {
        setMode("install");
      }
    };
    window.addEventListener("beforeinstallprompt", onBip);
    const onInstalled = () => {
      localStorage.setItem("ht-installed", "1");
      setMode("none");
    };
    window.addEventListener("appinstalled", onInstalled);

    const timer = window.setTimeout(() => {
      if (isStandalone()) {
        // App installée : demander l'autorisation des notifications
        if (
          "Notification" in window &&
          Notification.permission === "default" &&
          !isSnoozed(NOTIF_KEY)
        ) {
          setMode("notif");
        }
        return;
      }
      // Navigateur : proposer l'installation (pas dans l'aperçu en iframe)
      if (!inIframe && p !== "other" && localStorage.getItem("ht-installed") !== "1" && !isSnoozed(DISMISS_KEY)) {
        setMode("install");
      }
    }, 1500);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);


  if (mode === "none") return null;

  const close = () => {
    if (mode === "install") snooze(DISMISS_KEY);
    if (mode === "notif") snooze(NOTIF_KEY);
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
        await subscribeToPush();
        await sendThankYouNotification();
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
        className={`relative w-full max-w-[440px] bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] ${
          mode === "notif" ? "overflow-hidden rounded-[2.5rem]" : "rounded-3xl p-5"
        }`}
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
        role="dialog"
        aria-modal="true"
      >
        {mode === "install" && (
          <button
            onClick={close}
            aria-label="Fermer"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-lg leading-none text-slate-500"
          >
            ×
          </button>
        )}

        {mode === "install" ? (
          <>
            <div className="flex items-center gap-3">
              <img src="/app-icon-192.png" alt="" className="h-12 w-12 rounded-2xl shadow-sm" />
              <div>
                <h2 className="font-display text-[17px] font-semibold text-slate-900">
                  Installer Hasdé Tsion
                </h2>
                <p className="text-[12px] text-slate-500">
                  Installez l'application pour rester informé de tout : horaires, Chabbat et
                  annonces.
                </p>
              </div>
            </div>

            {deferredPrompt ? (
              <>
                <p className="mt-4 text-[14px] leading-relaxed text-slate-700">
                  Ajoutez Hasdé Tsion à votre écran d'accueil en un seul geste et recevez les
                  notifications de la communauté.
                </p>
                <button
                  onClick={async () => {
                    try {
                      setInstalling(true);
                      await deferredPrompt.prompt();
                      const res = await deferredPrompt.userChoice;
                      setDeferredPrompt(null);
                      if (res?.outcome === "accepted") {
                        localStorage.setItem("ht-installed", "1");
                        setMode("none");
                      }
                    } finally {
                      setInstalling(false);
                    }
                  }}
                  disabled={installing}
                  className="btn-blue-animated mt-5 flex min-h-[52px] w-full items-center justify-center rounded-2xl px-5 text-[15px] font-display font-semibold text-white active:scale-[0.97] transition-all disabled:opacity-60"
                >
                  {installing ? "Installation…" : "Installer l'application"}
                </button>
                <button
                  onClick={close}
                  className="mt-2 w-full py-2 text-[13px] font-medium text-slate-400"
                >
                  Plus tard
                </button>
              </>
            ) : (
              <>
                <ol className="mt-4 space-y-3 text-[14px] text-slate-700">
                  {platform === "ios" ? (
                    <>
                      <li className="flex gap-3">
                        <span className="font-semibold text-[#0F3D7A]">1.</span>
                        <span>
                          En bas de Safari, touchez le bouton <strong>Partager</strong> (le carré
                          avec une flèche vers le haut).
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
                          Touchez <strong>Ajouter</strong> : l'icône apparaît sur votre écran
                          d'accueil.
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

                {platform === "ios" && !isIOSSafari() && (
                  <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-800">
                    Sur iPhone, l'installation n'est possible que depuis <strong>Safari</strong>.
                    Ouvrez hasde-tsion.com dans Safari, puis suivez ces étapes.
                  </p>
                )}

                <button
                  onClick={close}
                  className="btn-blue-animated mt-5 flex min-h-[52px] w-full items-center justify-center rounded-2xl px-5 text-[15px] font-display font-semibold text-white active:scale-[0.97] transition-all"
                >
                  J'ai compris
                </button>
              </>
            )}

          </>
        ) : (
          <>
            {/* Decorative background mesh */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-100 opacity-60 blur-3xl" />
            <div className="pointer-events-none absolute -left-20 top-24 h-40 w-40 rounded-full bg-indigo-50 opacity-60 blur-3xl" />

            <div className="relative px-7 pb-7 pt-11">
              {/* Icon medallion */}
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 scale-150 animate-pulse rounded-full bg-blue-600 opacity-20 blur-2xl" />
                  <div className="relative flex h-20 w-20 -rotate-3 items-center justify-center rounded-3xl bg-gradient-to-br from-[#1E5BB8] to-[#0F3D7A] shadow-lg">
                    <svg
                      className="h-10 w-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </div>
                  <div className="absolute -right-1 -top-1 h-5 w-5 rounded-full border-4 border-white bg-sky-400" />
                </div>
              </div>

              <h2 className="font-display text-[22px] font-bold leading-tight text-slate-900">
                Activer les
                <br />
                notifications
              </h2>
              <p className="mx-auto mt-3 max-w-[300px] text-[14px] leading-relaxed text-slate-500">
                Recevez les horaires du Chabbat et les annonces de la communauté, en direct.
              </p>

              {notifState === "granted" && (
                <p className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700">
                  ✓ Notifications activées, merci ! Un message de remerciement vient de partir.
                </p>
              )}
              {notifState === "denied" && (
                <p className="mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-800">
                  Les notifications sont bloquées. Réactivez-les dans les réglages de votre
                  téléphone, à la rubrique de cette application.
                </p>
              )}
              {notifState === "new-tab" && (
                <p className="mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-800">
                  Ouvrez le site dans son propre onglet (ou depuis l'application installée)
                  pour autoriser les notifications.
                </p>
              )}
              {notifState === "unsupported" && (
                <p className="mt-6 rounded-2xl bg-slate-100 px-4 py-3 text-[13px] text-slate-600">
                  Votre téléphone ne prend pas en charge les notifications ici.
                </p>
              )}

              <div className="mt-7 space-y-3">
                <button
                  onClick={askNotifications}
                  className="w-full rounded-2xl bg-slate-900 py-4 text-[15px] font-semibold text-white shadow-xl shadow-slate-200 transition-all duration-200 active:scale-95"
                >
                  Autoriser les notifications
                </button>
                <button
                  onClick={close}
                  className="w-full py-2 text-[13px] font-medium text-slate-400 transition-colors hover:text-slate-600"
                >
                  Plus tard
                </button>
              </div>
            </div>

            {/* Bottom gradient accent */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500 opacity-30" />
          </>
        )}
      </div>
    </div>
  );
}
