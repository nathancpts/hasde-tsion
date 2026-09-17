import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { subscribeToPush } from "@/lib/push";
import { deleteMyAccount } from "@/lib/account.functions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Bell,
  Camera,
  ChevronRight,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Megaphone,
  ShieldCheck,
  Trash2,
} from "lucide-react";

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
  const deleteAccount = useServerFn(deleteMyAccount);
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
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

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

  const removeAccount = async () => {
    if (deleteConfirmation !== "SUPPRIMER") return;
    setDeleting(true);
    try {
      await queryClient.cancelQueries();
      await deleteAccount({});
      queryClient.clear();
      await supabase.auth.signOut({ scope: "local" });
      toast.success("Votre compte a été supprimé");
      navigate({ to: "/", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de supprimer le compte");
      setDeleting(false);
    }
  };

  const initials =
    ((firstName[0] ?? "") + (lastName[0] ?? "")).toUpperCase() || (email[0] ?? "?").toUpperCase();

  return (
    <main className="relative min-h-screen overflow-x-clip pb-16">
      <Toaster />
      <div
        aria-hidden="true"
        className="btn-blue-animated pointer-events-none absolute inset-0"
        style={{ transform: "translate3d(0,0,0)", willChange: "background-position" }}
      />
      <header className="relative px-5 pb-20 pt-[max(1.5rem,env(safe-area-inset-top))] text-primary-foreground">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-white">
            <ArrowLeft className="h-4 w-4" /> Accueil
          </Link>
          <Button
            onClick={signOut}
            variant="ghost"
            size="sm"
            className="gap-1.5 text-white hover:bg-white/15 hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Déconnexion
          </Button>
        </div>
        <div className="mx-auto mt-8 max-w-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">
            Espace personnel
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-white">Mon compte</h1>
        </div>
      </header>

      <div className="relative mx-auto -mt-12 max-w-xl space-y-4 px-4">
        {loading ? (
          <div className="rounded-2xl bg-white p-8 flex justify-center shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-[#1f4ea8]" />
          </div>
        ) : (
          <>
            {isAdmin && (
              <Link to="/admin" className="block rounded-2xl border border-gold/40 bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-gold/15 p-2.5"><ShieldCheck className="h-5 w-5 text-gold" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-display font-bold text-accent">Espace administrateur</p>
                      <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[9px] font-bold uppercase text-foreground">Actif</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Notifications, membres et parasha</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gold" />
                </div>
              </Link>
            )}

            {/* Profil */}
            <section className="rounded-2xl bg-card p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Modifier la photo"
                  onClick={() => fileRef.current?.click()}
                  className="relative h-16 w-16 shrink-0 rounded-full p-0"
                >
                  <Avatar className="h-16 w-16 ring-2 ring-accent/20">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
                    <AvatarFallback className="btn-blue-animated font-semibold text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-1 -right-1 rounded-full bg-accent p-1.5 ring-2 ring-card">
                    <Camera className="h-3 w-3 text-accent-foreground" />
                  </span>
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
                />
                <div>
                    <p className="font-display text-lg font-bold text-accent">
                    {firstName || "Membre"} {lastName}
                  </p>
                    <p className="mt-0.5 break-all text-xs text-muted-foreground">{email}</p>
                  <p className="text-xs text-muted-foreground">
                    {avatarPath ? "Photo personnalisée" : "Touchez la photo pour la changer"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-5">
                <div>
                   <Label className="text-[11px] text-accent">Prénom</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div>
                   <Label className="text-[11px] text-accent">Nom</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <Button
                onClick={saveProfile}
                disabled={saving}
                className="btn-blue-animated mt-3 w-full font-semibold text-white shadow-sm hover:opacity-90"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
              </Button>
            </section>

            {/* Notifications */}
            <section className="rounded-2xl bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <span className="h-fit rounded-xl bg-blue-soft p-2.5">
                    <Bell className="h-5 w-5 text-accent" />
                  </span>
                  <div>
                    <p className="font-display font-bold text-accent">Notifications</p>
                    <p className="text-xs text-muted-foreground max-w-[15rem]">
                      Horaires du Chabbat et annonces de la communauté sur cet appareil.
                    </p>
                  </div>
                </div>
                <Switch checked={notifOn} onCheckedChange={toggleNotifications} />
              </div>
            </section>

            {/* Annonces */}
            <section className="rounded-2xl bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Megaphone className="h-4 w-4 text-accent" />
                <p className="font-display font-bold text-accent">Dernières annonces</p>
              </div>
              {announcements.length === 0 ? (
                <p className="text-xs text-muted-foreground">Aucune annonce pour le moment.</p>
              ) : (
                <ul className="space-y-3">
                  {announcements.map((a) => (
                    <li key={a.id} className="rounded-xl bg-muted px-3 py-2.5">
                      <p className="text-sm font-semibold text-accent">{a.title}</p>
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

            {/* Sécurité */}
            <section className="rounded-2xl bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-accent" />
                <p className="font-display font-bold text-accent">Sécurité du compte</p>
              </div>
              <div className="space-y-2">
                <div>
                  <Label className="text-[11px] text-accent">Mot de passe actuel</Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-accent">Nouveau mot de passe</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={changePassword}
                className="btn-blue-animated mt-3 w-full font-semibold text-white shadow-sm hover:opacity-90"
              >
                Modifier le mot de passe
              </Button>
              <div className="my-5 h-px bg-border" />
              <Button
                onClick={signOut}
                className="btn-blue-animated w-full gap-2 font-semibold text-white shadow-sm hover:opacity-90"
              >
                <LogOut className="h-4 w-4" /> Se déconnecter
              </Button>

              <AlertDialog onOpenChange={(open) => !open && setDeleteConfirmation("")}>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="mt-2 w-full gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-4 w-4" /> Supprimer mon compte
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[calc(100%_-_2rem)] max-w-sm rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer définitivement le compte ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Votre profil, vos réglages et votre accès seront supprimés. Cette action est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div>
                    <Label htmlFor="delete-confirmation" className="text-xs">
                      Écrivez SUPPRIMER pour confirmer
                    </Label>
                    <Input
                      id="delete-confirmation"
                      value={deleteConfirmation}
                      onChange={(event) => setDeleteConfirmation(event.target.value.toUpperCase())}
                      autoComplete="off"
                      className="mt-2"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(event) => {
                        event.preventDefault();
                        void removeAccount();
                      }}
                      disabled={deleteConfirmation !== "SUPPRIMER" || deleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Supprimer définitivement"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-blue-soft p-2.5"><Mail className="h-5 w-5 text-accent" /></span>
                <div className="min-w-0">
                  <p className="font-display font-bold text-accent">Besoin d’aide ?</p>
                  <a href="mailto:info@hasde.fr" className="break-all text-sm text-foreground underline decoration-gold underline-offset-4">
                    info@hasde.fr
                  </a>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
