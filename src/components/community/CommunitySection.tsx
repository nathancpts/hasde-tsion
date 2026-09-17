import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { Mic, Square, Send, LogOut, Camera, Loader2 } from "lucide-react";

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

type MessageRow = {
  id: string;
  user_id: string;
  content: string | null;
  audio_url: string | null;
  created_at: string;
};

/* ============================================================ */
/* Helpers                                                       */
/* ============================================================ */

async function resolveSignedUrl(bucket: string, path: string | null): Promise<string | null> {
  if (!path) return null;
  // If full URL already, return as is
  if (path.startsWith("http")) return path;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

function initials(p: { first_name?: string | null; last_name?: string | null } | null | undefined) {
  if (!p) return "?";
  const f = (p.first_name?.[0] ?? "").toUpperCase();
  const l = (p.last_name?.[0] ?? "").toUpperCase();
  return (f + l) || "?";
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/* ============================================================ */
/* Main Component                                                */
/* ============================================================ */

export default function CommunitySection() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-white" />
      </div>
    );
  }

  return user ? <ChatPanel user={user} /> : <AuthPanel />;
}

/* ============================================================ */
/* Auth Panel — glassmorphism                                    */
/* ============================================================ */

function AuthPanel() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [busy, setBusy] = useState(false);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!firstName.trim() || !lastName.trim()) {
          toast.error("Prénom et nom requis");
          setBusy(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { first_name: firstName.trim(), last_name: lastName.trim() },
          },
        });
        if (error) throw error;
        toast.success("Compte créé !");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message ?? "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error((result.error as any).message ?? "Erreur Google");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Erreur");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-3xl p-6 border border-white/40 shadow-[0_8px_32px_rgba(15,61,122,0.2)]"
         style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(20px) saturate(160%)" }}>
      <h2 className="font-display text-2xl font-bold text-[#0a2a6b] text-center mb-1">
        {mode === "signin" ? "Connexion" : "Inscription"}
      </h2>
      <p className="text-center text-sm text-[#0a2a6b]/70 mb-5">
        Rejoignez la Communauté Hasdé Tsion
      </p>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={busy}
        className="w-full flex items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#3c4043] ring-1 ring-black/10 shadow-sm  transition active:scale-[0.98] disabled:opacity-60"
      >
        <GoogleIcon />
        Continuer avec Google
      </button>

      <div className="flex items-center gap-3 my-4">
        <div className="h-px flex-1 bg-[#0a2a6b]/15" />
        <span className="text-[10px] uppercase tracking-widest text-[#0a2a6b]/50">ou</span>
        <div className="h-px flex-1 bg-[#0a2a6b]/15" />
      </div>

      <form onSubmit={handleEmail} className="space-y-3">
        {mode === "signup" && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="fn" className="text-[11px] text-[#0a2a6b]">Prénom</Label>
              <Input id="fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} required
                className="bg-white/70 border-white/60" />
            </div>
            <div>
              <Label htmlFor="ln" className="text-[11px] text-[#0a2a6b]">Nom</Label>
              <Input id="ln" value={lastName} onChange={(e) => setLastName(e.target.value)} required
                className="bg-white/70 border-white/60" />
            </div>
          </div>
        )}
        <div>
          <Label htmlFor="em" className="text-[11px] text-[#0a2a6b]">Email</Label>
          <Input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="bg-white/70 border-white/60" />
        </div>
        <div>
          <Label htmlFor="pw" className="text-[11px] text-[#0a2a6b]">Mot de passe</Label>
          <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
            className="bg-white/70 border-white/60" />
        </div>
        <Button type="submit" disabled={busy}
          className="w-full bg-gradient-to-r from-[#0a2a6b] to-[#1f4ea8]  text-white font-semibold">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signin" ? "Se connecter" : "Créer le compte"}
        </Button>
      </form>

      <p className="text-center text-xs text-[#0a2a6b]/70 mt-4">
        {mode === "signin" ? "Pas encore membre ? " : "Déjà inscrit ? "}
        <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="font-semibold text-[#0a2a6b] underline">
          {mode === "signin" ? "Créer un compte" : "Se connecter"}
        </button>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 43.5c5.1 0 9.8-1.9 13.4-5.1l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.3 0-9.7-3-11.3-7.4l-6.5 5C9.5 39 16.2 43.5 24 43.5z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2c-.4.4 6.6-4.8 6.6-14.7 0-1.2-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

/* ============================================================ */
/* Chat Panel                                                    */
/* ============================================================ */

function ChatPanel({ user }: { user: User }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* Load profile + messages + subscribe */
  useEffect(() => {
    let alive = true;

    async function loadAll() {
      const [{ data: prof }, { data: msgs }, { data: allProfs }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("messages").select("*").order("created_at", { ascending: true }).limit(200),
        supabase.from("profiles").select("*"),
      ]);
      if (!alive) return;
      setProfile(prof as Profile | null);
      setMessages((msgs ?? []) as MessageRow[]);
      const map: Record<string, Profile> = {};
      (allProfs ?? []).forEach((p) => { map[(p as Profile).id] = p as Profile; });
      setProfiles(map);
      if ((prof as Profile | null)?.avatar_url) {
        resolveSignedUrl("avatars", (prof as Profile).avatar_url).then((u) => alive && setAvatarUrl(u));
      }
    }
    loadAll();

    const ch = supabase
      .channel("public:messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const m = payload.new as MessageRow;
          setMessages((prev) => prev.find((x) => x.id === m.id) ? prev : [...prev, m]);
          if (!profiles[m.user_id]) {
            const { data: p } = await supabase.from("profiles").select("*").eq("id", m.user_id).maybeSingle();
            if (p) setProfiles((prev) => ({ ...prev, [m.user_id]: p as Profile }));
          }
        })
      .subscribe();

    return () => { alive = false; supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  /* Auto-scroll */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  /* Send text */
  const handleSendText = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    setText("");
    const { error } = await supabase.from("messages").insert({ user_id: user.id, content: t });
    if (error) toast.error(error.message);
    setSending(false);
  };

  /* Avatar upload */
  const handleAvatarFile = async (file: File) => {
    if (!file) return;
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { toast.error(upErr.message); return; }
    const { error: updErr } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", user.id);
    if (updErr) { toast.error(updErr.message); return; }
    const signed = await resolveSignedUrl("avatars", path);
    setAvatarUrl(signed);
    setProfile((p) => p ? { ...p, avatar_url: path } : p);
    toast.success("Photo mise à jour");
  };

  /* Logout */
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex items-center gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="relative group"
          title="Changer la photo"
        >
          <Avatar className="h-12 w-12 ring-2 ring-[#1f4ea8]/20">
            {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
            <AvatarFallback className="bg-gradient-to-br from-[#0a2a6b] to-[#1f4ea8] text-white font-semibold">
              {initials(profile)}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-1 -right-1 bg-[#1f4ea8] rounded-full p-1 ring-2 ring-white">
            <Camera className="h-2.5 w-2.5 text-white" />
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleAvatarFile(e.target.files[0])}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Bonjour</p>
          <p className="font-display font-bold text-base text-foreground truncate">
            {profile?.first_name || "Membre"}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-muted-foreground   transition"
          title="Déconnexion"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {/* Chat thread */}
      <div className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex flex-col" style={{ height: "60vh", minHeight: 360 }}>
        <div className="px-4 py-3 border-b border-border/60">
          <p className="font-display font-bold text-sm text-foreground">Chat de la communauté</p>
          <p className="text-[10px] text-muted-foreground">Discussion temps réel</p>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-10">
              Aucun message. Soyez le premier à écrire 👋
            </p>
          )}
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              msg={m}
              isMine={m.user_id === user.id}
              sender={profiles[m.user_id] ?? null}
            />
          ))}
        </div>

        {/* Composer */}
        <Composer
          text={text}
          setText={setText}
          onSend={handleSendText}
          sending={sending}
          userId={user.id}
        />
      </div>
    </div>
  );
}

/* ============================================================ */
/* Message bubble                                                */
/* ============================================================ */

function MessageBubble({ msg, isMine, sender }: { msg: MessageRow; isMine: boolean; sender: Profile | null }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (sender?.avatar_url) resolveSignedUrl("avatars", sender.avatar_url).then(setAvatarUrl);
  }, [sender?.avatar_url]);

  useEffect(() => {
    if (msg.audio_url) resolveSignedUrl("chat-recordings", msg.audio_url).then(setAudioUrl);
  }, [msg.audio_url]);

  return (
    <div className={`flex gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
      <Avatar className="h-8 w-8 shrink-0">
        {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
        <AvatarFallback className="bg-gradient-to-br from-[#0a2a6b] to-[#1f4ea8] text-white text-[10px] font-semibold">
          {initials(sender)}
        </AvatarFallback>
      </Avatar>
      <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"} flex flex-col`}>
        <div className={`flex items-center gap-2 text-[10px] mb-0.5 ${isMine ? "flex-row-reverse" : ""}`}>
          <span className="font-semibold text-foreground">{sender?.first_name ?? "Membre"}</span>
          <span className="text-muted-foreground">{formatTime(msg.created_at)}</span>
        </div>
        <div
          className={`rounded-2xl px-3 py-2 text-sm leading-snug ${
            isMine
              ? "bg-gradient-to-br from-[#0a2a6b] to-[#1f4ea8] text-white rounded-tr-sm"
              : "bg-[#F1F5F9] text-foreground rounded-tl-sm"
          }`}
        >
          {msg.audio_url ? (
            audioUrl ? (
              <audio controls src={audioUrl} className="h-9 max-w-[220px]" />
            ) : (
              <span className="text-xs opacity-70">Chargement…</span>
            )
          ) : (
            <span className="whitespace-pre-wrap break-words">{msg.content}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* Composer with text + mic                                      */
/* ============================================================ */

function Composer({
  text, setText, onSend, sending, userId,
}: {
  text: string;
  setText: (v: string) => void;
  onSend: () => void;
  sending: boolean;
  userId: string;
}) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setUploading(true);
        const ext = (rec.mimeType.includes("mp4") ? "mp4" : "webm");
        const path = `${userId}/voice-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("chat-recordings")
          .upload(path, blob, { contentType: blob.type, upsert: false });
        if (upErr) {
          toast.error(upErr.message);
        } else {
          const { error } = await supabase.from("messages").insert({ user_id: userId, audio_url: path });
          if (error) toast.error(error.message);
        }
        setUploading(false);
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch (err: any) {
      toast.error("Micro indisponible : " + (err.message ?? ""));
    }
  }, [userId]);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }, []);

  return (
    <div className="border-t border-border/60 p-2.5">
      {recording && (
        <div className="flex items-center gap-2 px-2 pb-2 text-xs text-red-600 font-semibold">
          <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
          Enregistrement en cours…
        </div>
      )}
      <div className="flex items-end gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={recording ? "Enregistrement…" : "Votre message…"}
          disabled={recording || uploading}
          className="flex-1 bg-white"
        />
        {text.trim() ? (
          <Button
            onClick={onSend}
            disabled={sending}
            size="icon"
            className="bg-gradient-to-br from-[#0a2a6b] to-[#1f4ea8] text-white "
          >
            <Send className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={recording ? stopRecording : startRecording}
            disabled={uploading}
            size="icon"
            className={recording
              ? "bg-red-600  text-white"
              : "bg-gradient-to-br from-[#0a2a6b] to-[#1f4ea8] text-white "}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );
}
