const TV_UA = /SmartTV|SMART-TV|Tizen|Web0S|webOS|NetCast|HbbTV|BRAVIA|AFT[A-Z]|Android TV|GoogleTV|CrKey|AppleTV|Roku|Philips|Hisense|VIDAA|TitanOS|MiTV|MIBOX|MiBOX|Mi Box|Xiaomi.*TV|BrowseHere|Browse Here|AndroidTV|Large Screen|\bTV\b/i;

/** Détecte un téléviseur / box TV (navigateur TV, écran large en paysage, ou ?tv=1). */
export function isTVDevice(): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname.toLowerCase();
  if (path.startsWith("/tv")) return true;
  if (path.startsWith("/app")) return false;
  // Accueil « / » : toujours le site, sauf ?tv=1 explicite (cadre TV interne).
  if (path === "/" || path === "") {
    if (TV_UA.test(navigator.userAgent || "")) return true;
    try { return new URLSearchParams(window.location.search).get("tv") === "1"; } catch { return false; }
  }
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tv") === "1") {
      localStorage.setItem("ht-tv", "1");
      return true;
    }
    if (params.get("tv") === "0") {
      localStorage.removeItem("ht-tv");
      return false;
    }
  } catch {
    /* noop */
  }
  const ua = navigator.userAgent || "";
  // Téléphone / tablette : le plus petit côté de l'écran reste petit, même en
  // paysage. Dans ce cas, jamais le mode télé (on efface l'ancien marqueur auto).
  const shortSide = Math.min(window.screen?.width ?? 9999, window.screen?.height ?? 9999);
  const isPhone = /Android|iPhone|iPod/i.test(ua) && /Mobile/i.test(ua) && shortSide < 500;
  try {
    if (localStorage.getItem("ht-tv") === "1") {
      if (!isPhone) return true;
      localStorage.removeItem("ht-tv");
    }
  } catch {
    /* noop */
  }
  if (isPhone) return false;
  if (
    /SmartTV|SMART-TV|Tizen|Web0S|webOS|NetCast|HbbTV|BRAVIA|AFT[A-Z]|Android TV|GoogleTV|CrKey|AppleTV|Roku|Philips|Hisense|VIDAA|TitanOS|Large Screen|\bTV\b/i.test(
      ua,
    )
  )
    return true;
  const viewportWidth = Math.max(
    window.innerWidth,
    window.visualViewport?.width ?? 0,
    window.screen?.width ?? 0,
  );
  const viewportHeight = Math.max(
    window.innerHeight,
    window.visualViewport?.height ?? 0,
    window.screen?.height ?? 0,
  );
  const landscapeWide = viewportWidth > viewportHeight && viewportWidth >= 800;
  if (/Android/i.test(ua) && landscapeWide) return true;
  return false;
}

/** Adresse /APP : toujours la web app (vue téléphone), même sur grand écran. */
export function isAppPath(): boolean {
  return typeof window !== "undefined" && window.location.pathname.toLowerCase().startsWith("/app");
}

/** Téléphone (Android/iPhone) ou application installée : toujours la web app, quelle que soit la largeur. */
export function isPhoneDevice(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone) return true;
    const ua = navigator.userAgent || "";
    if (TV_UA.test(ua) || window.location.pathname.toLowerCase().startsWith("/tv")) return false;
    if (/iPhone|iPod|Android.+Mobile|Mobile.+Android|Windows Phone/i.test(ua)) return true;
    const uaData = (navigator as any).userAgentData;
    if (uaData?.mobile) return true;
    const short = Math.min(window.screen.width, window.screen.height);
    if (window.matchMedia("(pointer: coarse)").matches && short < 600) return true;
  } catch { /* ignore */ }
  return false;
}
