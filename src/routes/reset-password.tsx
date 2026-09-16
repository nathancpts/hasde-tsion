import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — Hasdé Tsion" },
      {
        name: "description",
        content: "Choisissez un nouveau mot de passe pour votre compte Hasdé Tsion.",
      },
      { property: "og:title", content: "Nouveau mot de passe — Hasdé Tsion" },
      { property: "og:description", content: "Réinitialisation du mot de passe Hasdé Tsion." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("6 caractères minimum");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Mot de passe mis à jour");
      navigate({ to: "/compte", replace: true });
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-5"
      style={{ background: "linear-gradient(160deg,#0a2a6b 0%,#1f4ea8 100%)" }}
    >
      <Toaster />
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl bg-white/95 p-6 shadow-[0_20px_60px_rgba(4,20,50,0.45)]"
      >
        <h1 className="font-display text-2xl font-bold text-[#0a2a6b] text-center mb-4">
          Nouveau mot de passe
        </h1>
        <Label className="text-[11px] text-[#0a2a6b]">Mot de passe</Label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button
          type="submit"
          disabled={busy}
          className="mt-4 w-full bg-gradient-to-r from-[#0a2a6b] to-[#1f4ea8] text-white"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Valider"}
        </Button>
      </form>
    </main>
  );
}
