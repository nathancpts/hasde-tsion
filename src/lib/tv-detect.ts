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
  // Les navigateurs de certaines TV Android annoncent à tort "Mobile" et
  // exposent une surface tactile. Leur viewport CSS peut aussi être limité à
  // 960 px malgré une dalle Full HD : on se base donc surtout sur le paysage.
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
  if (/Android/i.test(ua) && landscapeWide) {
    try {
      localStorage.setItem("ht-tv", "1");
    } catch {
      /* noop */
    }
    return true;
  }
  return false;
}
