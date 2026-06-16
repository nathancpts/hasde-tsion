import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
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
          className="hillel-orb fixed bottom-5 right-5 z-50 h-16 w-16 rounded-full transition active:scale-95"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        />
      )}

      {open && (
        <div
          className="fixed bottom-5 right-5 z-50 flex w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl"
          style={{ height: "min(70vh, 600px)" }}
        >
          <div className="flex items-center justify-between bg-gradient-to-r from-[#1f4ea8] to-[#2a5fc4] px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-base font-semibold">
                ה
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight">Hillel</div>
                <div className="text-[11px] opacity-80">Assistant religieux juif</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              className="rounded-full p-1 transition hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3 py-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-[#1f4ea8] text-white rounded-br-sm"
                      : "bg-white text-slate-800 shadow-sm rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-white px-3.5 py-2 text-sm text-slate-500 shadow-sm">
                  <Loader2 className="inline h-4 w-4 animate-spin" /> Hillel réfléchit...
                </div>
              </div>
            )}
          </div>

          <div className="flex items-end gap-2 border-t border-slate-200 bg-white p-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              rows={1}
              placeholder="Posez votre question..."
              className="max-h-32 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#1f4ea8] focus:bg-white"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              aria-label="Envoyer"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1f4ea8] text-white transition hover:bg-[#1a4291] disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
