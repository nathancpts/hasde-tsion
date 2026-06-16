import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { X, Send, Loader2 } from "lucide-react";
import { askHillel } from "@/lib/hillel.functions";

type Msg = { role: "user" | "assistant"; content: string };

export function HillelChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Shalom ! Je suis Hillel, votre assistant pour toutes vos questions sur la religion juive : Torah, Talmud, Halakha, fêtes... Comment puis-je vous aider ?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const ask = useServerFn(askHillel);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Lock body scroll when chat is open
  useEffect(() => {
    if (!open) return;
    const { overflow, position, top, width } = document.body.style;
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.position = position;
      document.body.style.top = top;
      document.body.style.width = width;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { reply } = await ask({
        data: { messages: next.map((m) => ({ role: m.role, content: m.content })) },
      });
      setMessages([...next, { role: "assistant", content: reply || "..." }]);
    } catch (e) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: `Désolé, une erreur est survenue : ${e instanceof Error ? e.message : "inconnue"}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le chat Hillel"
          className="hillel-orb-btn fixed bottom-5 right-5 z-50"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <span className="hillel-orb-core" />
          <span className="hillel-orb-swirl" />
          <span className="hillel-orb-shine" />
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[100] flex flex-col"
          style={{
            background:
              "radial-gradient(ellipse at top, #1f4ea8 0%, #0a1f4d 55%, #04081f 100%)",
            touchAction: "none",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 pb-3"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 14px)" }}
          >
            <div className="text-sm font-medium text-white/70">Hillel</div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Orb + greeting (only when no user message yet) */}
          {messages.length <= 1 && (
            <div className="flex flex-col items-center px-6 pt-6">
              <div className="hillel-orb-btn relative mb-6" style={{ width: 140, height: 140, position: "relative" }}>
                <span className="hillel-orb-core" />
                <span className="hillel-orb-swirl" />
                <span className="hillel-orb-shine" />
              </div>
              <div className="text-center text-sm text-white/60">Shalom</div>
              <h2 className="mt-2 text-center text-3xl font-semibold leading-tight text-white">
                Comment puis-je<br />vous aider ?
              </h2>
            </div>
          )}

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
            style={{ overscrollBehavior: "contain" }}
          >
            {messages.length > 1 &&
              messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed backdrop-blur ${
                      m.role === "user"
                        ? "bg-white text-slate-900 rounded-br-sm"
                        : "bg-white/10 text-white rounded-bl-sm border border-white/10"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-white/80 backdrop-blur">
                  <Loader2 className="inline h-4 w-4 animate-spin" /> Hillel réfléchit...
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div
            className="px-4"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
          >
            <div className="flex items-end gap-2 rounded-full border border-white/20 bg-white/10 p-1.5 pl-5 backdrop-blur-xl">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                rows={1}
                placeholder="Posez votre question..."
                className="max-h-32 flex-1 resize-none bg-transparent py-2 text-sm text-white placeholder:text-white/50 outline-none"
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                aria-label="Envoyer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1f4ea8] transition hover:bg-white/90 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
