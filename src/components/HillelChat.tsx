import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useServerFn } from "@tanstack/react-start";
import { Search, Loader2, X } from "lucide-react";
import { askHillel } from "@/lib/hillel.functions";

type Msg = { role: "user" | "assistant"; content: string };

export function HillelChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const ask = useServerFn(askHillel);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

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

  const close = () => {
    setOpen(false);
    setMessages([]);
    setInput("");
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Ouvrir Hillel"
          className="hillel-orb-btn fixed bottom-5 right-5 z-50"
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        >
          <span className="hillel-orb-core" />
          <span className="hillel-orb-swirl" />
          <span className="hillel-orb-shine" />
        </button>
      )}

      {open && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-stretch px-3"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
        >
          {/* Answer card (only when there are messages) */}
          {(messages.length > 0 || loading) && (
            <div
              className="hillel-gradient-border mx-auto mb-2 w-full max-w-md overflow-hidden bg-white shadow-2xl"
              style={{ borderRadius: "20px" }}
            >
              <div
                ref={scrollRef}
                className="space-y-2 overflow-y-auto p-3 text-slate-900"
                style={{ maxHeight: "55vh" }}
              >
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] overflow-hidden break-words rounded-xl px-3 py-2 text-sm leading-relaxed ${
                        m.role === "user"
                          ? "whitespace-pre-wrap bg-gradient-to-br from-[#4a7bd1] to-[#1f4ea8] text-white"
                          : "bg-slate-100 text-slate-900"
                      }`}
                    >
                      {m.role === "assistant" ? (
                        <div className="prose prose-sm prose-slate max-w-none break-words [&_a]:break-all [&_a]:text-[#1f4ea8] [&_p]:my-1 [&_ol]:my-1 [&_ul]:my-1 [&_li]:my-0.5">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                        </div>
                      ) : (
                        m.content
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600">
                      <Loader2 className="inline h-4 w-4 animate-spin" /> Hillel réfléchit...
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}



          {/* Search bar */}
          <div className="hillel-gradient-border mx-auto flex w-full max-w-sm items-center gap-1 py-1.5 pl-4 pr-1.5 shadow-2xl">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Posez votre question..."
              className="min-w-0 flex-1 bg-transparent py-1.5 text-[16px] text-slate-900 placeholder:text-slate-400 outline-none"
            />
            <button
              onClick={close}
              aria-label="Fermer"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              aria-label="Envoyer"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4a7bd1] to-[#1f4ea8] text-white transition hover:opacity-90 disabled:opacity-40"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
            </button>
          </div>



        </div>
      )}
    </>
  );
}
