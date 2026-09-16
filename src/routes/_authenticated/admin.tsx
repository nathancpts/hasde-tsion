import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { sendAnnouncementNow, getAdminStats } from "@/lib/notifications.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  Clock,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Send,
  Trash2,
  Users,
  Smartphone,
  History,
} from "lucide-react";
import { DEFAULT_PARASHA_CONTENT } from "@/lib/parasha-content";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administration — Hasdé Tsion" },
      {
        name: "description",
        content: "Espace administrateur : envoyer et programmer les notifications de la communauté.",
      },
      { property: "og:title", content: "Administration — Hasdé Tsion" },
      {
        property: "og:description",
        content: "Gestion des notifications et des membres de Hasdé Tsion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type EditBloc = {
  titre: string;
  icone: string;
  paragraphes: string;
  puces: string;
};

type Row = {
  id: string;
  title: string;
  body: string;
  url: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  sent_count: number;
  created_at: string;
};

function AdminPage() {
  const navigate = useNavigate();
  const sendNow = useServerFn(sendAnnouncementNow);
  const loadStats = useServerFn(getAdminStats);

  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<"envoyer" | "parasha" | "historique" | "membres">("envoyer");
  const [pRowId, setPRowId] = useState<string | null>(null);
  const [pNom, setPNom] = useState("");
  const [pNomHe, setPNomHe] = useState("");
  const [pIntro, setPIntro] = useState("");
  const [pBlocs, setPBlocs] = useState<EditBloc[]>([]);
  const [pBusy, setPBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [when, setWhen] = useState("");
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [stats, setStats] = useState<{
    members: number;
    devices: number;
    list: { id: string; first_name: string | null; last_name: string | null; created_at: string }[];
  } | null>(null);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setRows((data ?? []) as Row[]);
    try {
      setStats(await loadStats({}));
    } catch {
      /* ignore */
    }
    const { data: pc } = await supabase
      .from("parasha_content")
      .select("id, nom, nom_he, intro, blocs")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (pc) {
      setPRowId(pc.id);
      setPNom(pc.nom ?? "");
      setPNomHe(pc.nom_he ?? "");
      setPIntro(pc.intro ?? "");
      setPBlocs(toEdit(Array.isArray(pc.blocs) ? (pc.blocs as any[]) : []));
    } else {
      setPRowId(null);
      setPNom("");
      setPNomHe("");
      setPIntro("");
      setPBlocs(toEdit(DEFAULT_PARASHA_CONTENT.blocs as any[]));
    }
  }, [loadStats]);

  const saveParasha = async () => {
    setPBusy(true);
    try {
      const blocs = pBlocs
        .filter((b) => b.titre.trim() || b.paragraphes.trim() || b.puces.trim())
        .map((b) => ({
          titre: b.titre.trim(),
          ...(b.icone.trim() ? { icone: b.icone.trim() } : {}),
          ...(b.paragraphes.trim()
            ? { paragraphes: b.paragraphes.split(/\n\s*\n|\n/).map((s) => s.trim()).filter(Boolean) }
            : {}),
          ...(b.puces.trim()
            ? { puces: b.puces.split("\n").map((s) => s.trim()).filter(Boolean) }
            : {}),
        }));
      const { data: auth } = await supabase.auth.getUser();
      const payload = {
        nom: pNom.trim() || null,
        nom_he: pNomHe.trim() || null,
        intro: pIntro.trim() || null,
        blocs,
        is_active: true,
        updated_by: auth.user?.id ?? null,
      };
      if (pRowId) {
        const { error } = await supabase.from("parasha_content").update(payload).eq("id", pRowId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("parasha_content")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        setPRowId(data.id);
      }
      toast.success("Texte de la parasha enregistré");
      await refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur d'enregistrement");
    } finally {
      setPBusy(false);
    }
  };

  const resetParasha = async () => {
    setPBusy(true);
    try {
      if (pRowId) {
        const { error } = await supabase.from("parasha_content").delete().eq("id", pRowId);
        if (error) throw error;
      }
      setPRowId(null);
      setPNom("");
      setPNomHe("");
      setPIntro("");
      setPBlocs(toEdit(DEFAULT_PARASHA_CONTENT.blocs as any[]));
      toast.success("Texte automatique rétabli");
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur");
    } finally {
      setPBusy(false);
    }
  };

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data: admin } = await supabase.rpc("has_role", {
        _user_id: auth.user.id,
        _role: "admin",
      });
      if (!admin) {
        toast.error("Accès réservé aux administrateurs");
        navigate({ to: "/compte", replace: true });
        return;
      }
      setChecking(false);
      refresh();
    })();
  }, [navigate, refresh]);

  const submit = async (schedule: boolean) => {
    if (!title.trim() || !body.trim()) {
      toast.error("Titre et message requis");
      return;
    }
    setBusy(true);
    try {
      if (schedule) {
        if (!when) {
          toast.error("Choisissez une date et une heure");
          return;
        }
        const { data: auth } = await supabase.auth.getUser();
        const { error } = await supabase.from("announcements").insert({
          title: title.trim(),
          body: body.trim(),
          url: url.trim() || null,
          scheduled_at: new Date(when).toISOString(),
          created_by: auth.user?.id ?? null,
        });
        if (error) throw error;
        toast.success("Notification programmée");
      } else {
        const res = await sendNow({
          data: { title: title.trim(), body: body.trim(), url: url.trim() || undefined },
        });
        toast.success(`Envoyée à ${res.sent} appareil${res.sent > 1 ? "s" : ""}`);
      }
      setTitle("");
      setBody("");
      setUrl("");
      setWhen("");
      await refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Une erreur est survenue");
    } finally {
      setBusy(false);
    }
  };

  const sendPending = async (row: Row) => {
    setBusy(true);
    try {
      const res = await sendNow({
        data: { id: row.id, title: row.title, body: row.body, url: row.url ?? undefined },
      });
      toast.success(`Envoyée à ${res.sent} appareil${res.sent > 1 ? "s" : ""}`);
      await refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur d'envoi");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Supprimée");
      refresh();
    }
  };

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="h-6 w-6 animate-spin text-[#1f4ea8]" />
      </main>
    );
  }

  const pending = rows.filter((r) => !r.sent_at);
  const sentRows = rows.filter((r) => r.sent_at);

  return (
    <main className="min-h-screen bg-[#F8F9FA] pb-16">
      <Toaster />
      <header
        className="px-5 pt-6 pb-16 text-white"
        style={{ background: "linear-gradient(160deg,#0a2a6b 0%,#1f4ea8 100%)" }}
      >
        <Link to="/compte" className="inline-flex items-center gap-2 text-white/85 text-sm">
          <ArrowLeft className="h-4 w-4" /> Mon compte
        </Link>
        <h1 className="font-display text-3xl font-bold mt-6">Administration</h1>
        <p className="text-white/75 text-sm mt-1">Notifications de la communauté</p>
      </header>

      <div className="px-4 -mt-10 space-y-4 max-w-2xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(10,42,107,0.08)]">
            <div className="flex items-center gap-2 text-[#1f4ea8]">
              <Users className="h-4 w-4" />
              <span className="text-[11px] uppercase tracking-wider">Membres</span>
            </div>
            <p className="font-display text-2xl font-bold text-[#0a2a6b] mt-1">
              {stats?.members ?? "—"}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(10,42,107,0.08)]">
            <div className="flex items-center gap-2 text-[#1f4ea8]">
              <Smartphone className="h-4 w-4" />
              <span className="text-[11px] uppercase tracking-wider">Appareils</span>
            </div>
            <p className="font-display text-2xl font-bold text-[#0a2a6b] mt-1">
              {stats?.devices ?? "—"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 rounded-2xl bg-white p-1.5 shadow-[0_2px_10px_rgba(10,42,107,0.08)]">
          {(
            [
              ["envoyer", "Envoyer", Bell],
              ["historique", "Historique", History],
              ["membres", "Membres", Users],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors duration-300 border-0 outline-none appearance-none ${
                tab === key ? "bg-[#0a2a6b] text-white" : "text-[#0a2a6b]/70"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {tab === "envoyer" && (
          <section className="rounded-2xl bg-white p-5 shadow-[0_2px_10px_rgba(10,42,107,0.08)] space-y-3">
            <div>
              <Label className="text-[11px] text-[#0a2a6b]">Titre</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex : Cours de Torah ce soir"
              />
            </div>
            <div>
              <Label className="text-[11px] text-[#0a2a6b]">Message</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                placeholder="Le texte que recevront les membres…"
              />
            </div>
            <div>
              <Label className="text-[11px] text-[#0a2a6b]">Lien à l'ouverture (optionnel)</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/" />
            </div>
            <div>
              <Label className="text-[11px] text-[#0a2a6b]">Programmer (optionnel)</Label>
              <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                onClick={() => submit(false)}
                disabled={busy}
                className="flex-1 bg-gradient-to-r from-[#0a2a6b] to-[#1f4ea8] text-white"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="ml-1.5">Envoyer maintenant</span>
              </Button>
              <Button
                onClick={() => submit(true)}
                disabled={busy || !when}
                variant="outline"
                className="flex-1"
              >
                <Clock className="h-4 w-4" />
                <span className="ml-1.5">Programmer</span>
              </Button>
            </div>

            {pending.length > 0 && (
              <div className="pt-3 border-t border-border/60">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                  Programmées
                </p>
                <ul className="space-y-2">
                  {pending.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-xl bg-[#F1F5F9] px-3 py-2.5 flex items-start gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0a2a6b] truncate">{r.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {r.scheduled_at
                            ? new Date(r.scheduled_at).toLocaleString("fr-FR", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "Sans date"}
                        </p>
                      </div>
                      <button
                        onClick={() => sendPending(r)}
                        className="p-1.5 rounded-lg text-[#1f4ea8] hover:bg-white"
                        title="Envoyer tout de suite"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(r.id)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-white"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {tab === "historique" && (
          <section className="rounded-2xl bg-white p-5 shadow-[0_2px_10px_rgba(10,42,107,0.08)]">
            {sentRows.length === 0 ? (
              <p className="text-xs text-muted-foreground">Aucune notification envoyée.</p>
            ) : (
              <ul className="space-y-3">
                {sentRows.map((r) => (
                  <li key={r.id} className="rounded-xl bg-[#F1F5F9] px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-[#0a2a6b]">{r.title}</p>
                      <button
                        onClick={() => remove(r.id)}
                        className="p-1 rounded-lg text-red-600 hover:bg-white"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-foreground/80 mt-0.5 whitespace-pre-wrap">{r.body}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(r.sent_at!).toLocaleString("fr-FR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}{" "}
                      · {r.sent_count} appareil{r.sent_count > 1 ? "s" : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === "membres" && (
          <section className="rounded-2xl bg-white p-5 shadow-[0_2px_10px_rgba(10,42,107,0.08)]">
            {!stats || stats.list.length === 0 ? (
              <p className="text-xs text-muted-foreground">Aucun membre inscrit.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {stats.list.map((m) => (
                  <li key={m.id} className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-sm text-[#0a2a6b] font-medium">
                      {[m.first_name, m.last_name].filter(Boolean).join(" ") || "Membre"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
