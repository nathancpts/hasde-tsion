/** Détecte un téléviseur / box TV (navigateur TV, écran large en paysage, ou ?tv=1). */
export function isTVDevice(): boolean {
  if (typeof window === "undefined") return false;
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
    if (localStorage.getItem("ht-tv") === "1") return true;
  } catch {
    /* noop */
  }
  const ua = navigator.userAgent || "";
  if (
    /SmartTV|SMART-TV|Tizen|Web0S|webOS|NetCast|HbbTV|BRAVIA|AFT[A-Z]|Android TV|GoogleTV|CrKey|AppleTV|Roku|Philips|Hisense|VIDAA|TitanOS|Large Screen|\bTV\b/i.test(
      ua,
    )
  )
    return true;
  // Box Android sans mention "Mobile" en paysage large = TV
  const landscapeWide =
    window.matchMedia("(orientation: landscape)").matches && window.innerWidth >= 900;
  if (/Android/i.test(ua) && !/Mobile/i.test(ua) && landscapeWide && !("ontouchstart" in window))
    return true;
  return false;
}
