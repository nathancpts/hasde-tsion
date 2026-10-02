import { useEffect, useState } from "react";
import QRCode from "qrcode";

const APP_URL = "https://hasde-tsion.com/APP";
const INTERVAL = 15 * 60 * 1000;
const DURATION = 45 * 1000;

/** Toutes les 15 min sur l'écran TV, invite à installer l'application via un QR code. */
export function TVAppQrPopup() {
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(APP_URL, { width: 600, margin: 1, color: { dark: "#0A1128", light: "#FFFFFF" } })
      .then(setQr)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let hide: ReturnType<typeof setTimeout>;
    const id = setInterval(() => {
      setOpen(true);
      hide = setTimeout(() => setOpen(false), DURATION);
    }, INTERVAL);
    return () => { clearInterval(id); clearTimeout(hide); };
  }, []);

  if (!open || !qr) return null;
  return (
    <div
      className="fixed inset-0 z-[9500] flex items-center justify-center"
      style={{ background: "rgba(10,17,40,0.6)", backdropFilter: "blur(24px)" }}
      onClick={() => setOpen(false)}
    >
      <div
        className="flex items-center gap-[4vh]"
        style={{
          padding: "5vh 5vh",
          borderRadius: 32,
          background: "rgba(255,255,255,0.10)",
          border: "1px solid rgba(255,255,255,0.22)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
        }}
      >
        <img src={qr} alt="QR code de l'application" style={{ width: "34vh", height: "34vh", borderRadius: 20, background: "#fff", padding: "1.2vh" }} />
        <div style={{ maxWidth: "52vh", color: "#F3F6FC" }}>
          <p className="uppercase" style={{ fontSize: "1.5vh", letterSpacing: "0.32em", fontWeight: 700, color: "#E9C46A" }}>
            Application Hasdé Tsion
          </p>
          <h2 style={{ fontSize: "5vh", fontWeight: 700, lineHeight: 1.1, marginTop: "1.5vh" }}>
            Installez l’application sur votre téléphone
          </h2>
          <p style={{ fontSize: "2.2vh", color: "#DBE7FB", marginTop: "2vh", lineHeight: 1.5 }}>
            Scannez le QR code : horaires, parasha, chants et notifications de la communauté, toujours avec vous.
          </p>
          <p style={{ fontSize: "1.8vh", color: "#9FB0CF", marginTop: "2vh" }}>hasde-tsion.com/APP</p>
        </div>
      </div>
    </div>
  );
}
