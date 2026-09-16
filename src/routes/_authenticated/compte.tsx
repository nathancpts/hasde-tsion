import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subscribeToPush } from "@/lib/push";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { ArrowLeft, Camera, LogOut, Loader2, ShieldCheck, Bell, Megaphone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/compte")({
  head: () => ({
    meta: [
      { title: "Mon compte — Hasdé Tsion" },
      {
        name: "description",
        content: "Gérez votre profil, vos notifications et retrouvez les annonces de la communauté.",
      },
      { property: "og:title", content: "Mon compte — Hasdé Tsion" },
      {
        property: "og:description",
        content: "Profil, notifications et annonces de la communauté Hasdé Tsion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ComptePage,
});

type Announcement = {
  id: string;
  title: string;
  body: string;
  sent_at: string | null;
};

function ComptePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notifOn, setNotifOn] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) return;
    setUserId(user.id);
    setEmail(user.email ?? "");

    const [{ data: profile }, { data: admin }, { data: annonces }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      supabase
        .from("announcements")
        .select("id, title, body, sent_at")
        .not("sent_at", "is", null)
        .order("sent_at", { ascending: false })
        .limit(10),
    ]);

    if (profile) {
      setFirstName(profile.first_name ?? "");
      setLastName(profile.last_name ?? "");
      setAvatarPath(profile.avatar_url ?? null);
      setNotifOn(Boolean((profile as any).notifications_enabled));
      if (profile.avatar_url) {
        if (profile.avatar_url.startsWith("http")) setAvatarUrl(profile.avatar_url);
        else {
          const { data } = await supabase.storage
            .from("avatars")
            .createSignedUrl(profile.avatar_url, 3600);
          setAvatarUrl(data?.signedUrl ?? null);
        }
      }
    }
    setIsAdmin(Boolean(admin));
    setAnnouncements((annonces ?? []) as Announcement[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveProfile = async () => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, first_name: firstName.trim(), last_name: lastName.trim() });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profil enregistré");
  };

  const uploadAvatar = async (file: File) => {
    if (!userId) return;
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (upErr) {
      toast.error(upErr.message);
      return;
    }
    const { error } = await supabase.from("profiles").upsert({ id: userId, avatar_url: path });
    if (error) {
      toast.error(error.message);
      return;
    }
    const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
    setAvatarPath(path);
    setAvatarUrl(data?.signedUrl ?? null);
    toast.success("Photo mise à jour");
  };

  const toggleNotifications = async (next: boolean) => {
    if (!userId) return;
    if (next) {
      if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") {
          toast.error("Notifications refusées par votre appareil");
          return;
        }
      }
      const ok = await subscribeToPush();
      if (!ok) {
        toast.error("Impossible d'activer les notifications sur cet appareil");
        return;
      }
      await supabase
        .from("push_subscriptions")
        .update({ user_id: userId })
        .is("user_id", null)
        .then(() => undefined);
      toast.success("Notifications activées");
    } else {
      const { data: existing } = await supabase
        .from("push_subscriptions")
        .select("id")
        .eq("user_id", userId);
      if (existing?.length) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .in("id", existing.map((r) => r.id));
      }
      toast.success("Notifications désactivées");
    }
    setNotifOn(next);
    await supabase.from("profiles").upsert({ id: userId, notifications_enabled: next } as any);
  };

  const changePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("6 caractères minimum");
      return;
    }
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      ...(currentPassword ? ({ current_password: currentPassword } as any) : {}),
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Mot de passe modifié");
      setNewPassword("");
      setCurrentPassword("");
    }
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const initials =
    ((firstName[0] ?? "") + (lastName[0] ?? "")).toUpperCase() || (email[0] ?? "?").toUpperCase();

  return (
    <main className="min-h-screen bg-[#F8F9FA] pb-16">
      <Toaster />
      <header
        className="px-5 pt-6 pb-16 text-white"
        style={{ background: "linear-gradient(160deg,#0a2a6b 0%,#1f4ea8 100%)" }}
      >
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-white/85 text-sm">
            <ArrowLeft className="h-4 w-4" /> Accueil
          </Link>
          <button onClick={signOut} className="inline-flex items-center gap-1.5 text-white/85 text-sm">
            <LogOut className="h-4 w-4" /> Déconnexion
          </button>
        </div>
        <h1 className="font-display text-3xl font-bold mt-6">Mon compte</h1>
        <p className="text-white/75 text-sm mt-1">{email}</p>
      </header>

      <div className="px-4 -mt-10 space-y-4 max-w-xl mx-auto">
        {loading ? (
          <div className="rounded-2xl bg-white p-8 flex justify-center shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-[#1f4ea8]" />
          </div>
        ) : (
          <>
            {isAdmin && (
              <Link
                to="/admin"
                className="block rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(10,42,107,0.08)] border border-[#D4AF37]/40"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-[#D4AF37]/15 p-2.5">
                    <ShieldCheck className="h-5 w-5 text-[#a5822a]" />
                  </span>
                  <div>
                    <p className="font-display font-bold text-[#0a2a6b]">Espace administrateur</p>
                    <p className="text-xs text-muted-foreground">
                      Envoyer et programmer les notifications
                    </p>
                  </div>
                </div>
              </Link>
            )}

            {/* Profil */}
            <section className="rounded-2xl bg-white p-5 shadow-[0_2px_10px_rgba(10,42,107,0.08)]">
              <div className="flex items-center gap-4">
                <button onClick={() => fileRef.current?.click()} className="relative">
                  <Avatar className="h-16 w-16 ring-2 ring-[#1f4ea8]/20">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
                    <AvatarFallback className="bg-gradient-to-br from-[#0a2a6b] to-[#1f4ea8] text-white font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-1 -right-1 bg-[#1f4ea8] rounded-full p-1.5 ring-2 ring-white">
                    <Camera className="h-3 w-3 text-white" />
                  </span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
                />
                <div>
                  <p className="font-display font-bold text-lg text-[#0a2a6b]">
                    {firstName || "Membre"} {lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {avatarPath ? "Photo personnalisée" : "Touchez la photo pour la changer"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-5">
                <div>
                  <Label className="text-[11px] text-[#0a2a6b]">Prénom</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div>
                  <Label className="text-[11px] text-[#0a2a6b]">Nom</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <Button
                onClick={saveProfile}
                disabled={saving}
                className="mt-3 w-full bg-gradient-to-r from-[#0a2a6b] to-[#1f4ea8] text-white"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
              </Button>
            </section>

            {/* Notifications */}
            <section className="rounded-2xl bg-white p-5 shadow-[0_2px_10px_rgba(10,42,107,0.08)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <span className="rounded-xl bg-[#1f4ea8]/10 p-2.5 h-fit">
                    <Bell className="h-5 w-5 text-[#1f4ea8]" />
                  </span>
                  <div>
                    <p className="font-display font-bold text-[#0a2a6b]">Notifications</p>
                    <p className="text-xs text-muted-foreground max-w-[15rem]">
                      Horaires du Chabbat et annonces de la communauté sur cet appareil.
                    </p>
                  </div>
                </div>
                <Switch checked={notifOn} onCheckedChange={toggleNotifications} />
              </div>
            </section>

            {/* Annonces */}
            <section className="rounded-2xl bg-white p-5 shadow-[0_2px_10px_rgba(10,42,107,0.08)]">
              <div className="flex items-center gap-2 mb-3">
                <Megaphone className="h-4 w-4 text-[#1f4ea8]" />
                <p className="font-display font-bold text-[#0a2a6b]">Dernières annonces</p>
              </div>
              {announcements.length === 0 ? (
                <p className="text-xs text-muted-foreground">Aucune annonce pour le moment.</p>
              ) : (
                <ul className="space-y-3">
                  {announcements.map((a) => (
                    <li key={a.id} className="rounded-xl bg-[#F1F5F9] px-3 py-2.5">
                      <p className="text-sm font-semibold text-[#0a2a6b]">{a.title}</p>
                      <p className="text-xs text-foreground/80 mt-0.5 whitespace-pre-wrap">{a.body}</p>
                      {a.sent_at && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(a.sent_at).toLocaleString("fr-FR", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Mot de passe */}
            <section className="rounded-2xl bg-white p-5 shadow-[0_2px_10px_rgba(10,42,107,0.08)]">
              <p className="font-display font-bold text-[#0a2a6b] mb-3">Mot de passe</p>
              <div className="space-y-2">
                <div>
                  <Label className="text-[11px] text-[#0a2a6b]">Mot de passe actuel</Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-[#0a2a6b]">Nouveau mot de passe</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={changePassword} variant="outline" className="mt-3 w-full">
                Modifier le mot de passe
              </Button>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
