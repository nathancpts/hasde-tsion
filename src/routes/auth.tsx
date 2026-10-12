import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Loader2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — Hasdé Tsion" },
      {
        name: "description",
        content:
          "Connectez-vous ou créez votre compte Hasdé Tsion pour gérer votre profil et vos notifications.",
      },
      { property: "og:title", content: "Connexion — Hasdé Tsion" },
      {
        property: "og:description",
        content: "Espace membre de la communauté Hasdé Tsion : profil et notifications.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) navigate({ to: "/compte", replace: true });
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) navigate({ to: "/compte", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!firstName.trim() || !lastName.trim()) {
          toast.error("Prénom et nom requis");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/compte",
            data: { first_name: firstName.trim(), last_name: lastName.trim() },
          },
        });
        if (error) throw error;
        if (!data.session) setCheckEmail(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Une erreur est survenue");
    } finally {
      setBusy(false);
    }
  };


  return (
    <main
      className="min-h-screen px-5 py-10 flex flex-col items-center justify-center"
      style={{
        background:
          "linear-gradient(160deg, #0a2a6b 0%, #123a86 45%, #1f4ea8 100%)",
      }}
    >
      <Toaster />
      <Link
        to="/"
        className="self-start mb-6 inline-flex items-center gap-2 text-white/80 text-sm "
      >
        <ArrowLeft className="h-4 w-4" /> Retour
      </Link>

      <div
        className="w-full max-w-sm rounded-3xl p-6 border border-white/40 shadow-[0_20px_60px_rgba(4,20,50,0.45)]"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(20px) saturate(160%)",
        }}
      >
        <img src="/__l5e/assets-v1/2cd6a4d8-9ccf-47da-8b6b-d5f8ab6aa0e2/app-icon-192-white.png" alt="" className="h-14 w-14 mx-auto mb-3 rounded-2xl" />
        <h1 className="font-display text-2xl font-bold text-[#0a2a6b] text-center">
          {checkEmail ? "Vérifiez vos e-mails" : mode === "signin" ? "Connexion" : "Créer un compte"}
        </h1>

        {checkEmail ? (
          <div className="mt-4 text-center text-sm text-[#0a2a6b]/80 space-y-4">
            <p>
              Un lien de confirmation vient d'être envoyé à <strong>{email}</strong>. Ouvrez-le pour
              activer votre compte.
            </p>
            <Button
              onClick={() => {
                setCheckEmail(false);
                setMode("signin");
              }}
              className="w-full bg-gradient-to-r from-[#0a2a6b] to-[#1f4ea8] text-white"
            >
              J'ai confirmé, me connecter
            </Button>
          </div>
        ) : (
          <>
            <p className="text-center text-sm text-[#0a2a6b]/70 mt-1 mb-5">
              Votre espace membre Hasdé Tsion
            </p>


            <form onSubmit={handleEmail} className="space-y-3">
              {mode === "signup" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="fn" className="text-[11px] text-[#0a2a6b]">
                      Prénom
                    </Label>
                    <Input
                      id="fn"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="bg-white border-[#0a2a6b]/15"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ln" className="text-[11px] text-[#0a2a6b]">
                      Nom
                    </Label>
                    <Input
                      id="ln"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="bg-white border-[#0a2a6b]/15"
                    />
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="em" className="text-[11px] text-[#0a2a6b]">
                  Email
                </Label>
                <Input
                  id="em"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white border-[#0a2a6b]/15"
                />
              </div>
              <div>
                <Label htmlFor="pw" className="text-[11px] text-[#0a2a6b]">
                  Mot de passe
                </Label>
                <Input
                  id="pw"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-white border-[#0a2a6b]/15"
                />
              </div>
              <Button
                type="submit"
                disabled={busy}
                className="w-full bg-gradient-to-r from-[#0a2a6b] to-[#1f4ea8]  text-white font-semibold"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === "signin" ? (
                  "Se connecter"
                ) : (
                  "Créer le compte"
                )}
              </Button>
            </form>

            {mode === "signin" && (
              <button
                type="button"
                onClick={async () => {
                  if (!email) {
                    toast.error("Entrez votre email d'abord");
                    return;
                  }
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                  });
                  if (error) toast.error(error.message);
                  else toast.success("Email de réinitialisation envoyé");
                }}
                className="mt-3 w-full text-center text-xs text-[#0a2a6b]/70 underline"
              >
                Mot de passe oublié ?
              </button>
            )}

            <p className="text-center text-xs text-[#0a2a6b]/70 mt-4">
              {mode === "signin" ? "Pas encore membre ? " : "Déjà inscrit ? "}
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="font-semibold text-[#0a2a6b] underline"
              >
                {mode === "signin" ? "Créer un compte" : "Se connecter"}
              </button>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
