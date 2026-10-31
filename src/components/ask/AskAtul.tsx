"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { projects, site } from "@/data/site";
import { localAnswer, parseActions, type AskAction } from "@/lib/ask/brain";
import { useSite } from "@/lib/site-context";

type Turn = { role: "user" | "assistant"; content: string; actions?: AskAction[]; done?: boolean };

const SUGGESTIONS = [
  "What has Atul built?",
  "Show me MeshRelay",
  "Is he available to hire?",
  "Give me the 30-second version",
];

const sectionName: Record<string, string> = {
  top: "the top", about: "About", work: "Work", tools: "Tools", play: "the game", contact: "Contact",
};

function receipt(a: AskAction) {
  switch (a.type) {
    case "go": return `Took you to ${sectionName[a.id]}`;
    case "open": return `Opened ${projects.find((p) => p.slug === a.slug)?.name ?? "the project"}`;
    case "quick": return "Opened the recruiter view";
    default: return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function AskAtul() {
  const { askOpen, setAskOpen, navigate, setQuickView, toast, lock, unlock, hasResume } = useSite();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"live" | "profile" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const abort = useRef<AbortController | null>(null);

  // ⌘K / Ctrl+K anywhere, or "/" when not typing, opens the panel. Escape closes it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest?.("input,textarea,[contenteditable]");
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAskOpen(!askOpen);
      } else if (e.key === "/" && !typing && !askOpen) {
        e.preventDefault();
        setAskOpen(true);
      } else if (e.key === "Escape" && askOpen) {
        setAskOpen(false);
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [askOpen, setAskOpen]);

  useEffect(() => {
    if (askOpen) {
      opener.current = document.activeElement as HTMLElement | null;
      lock("ask");
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
    unlock("ask");
    opener.current?.focus?.();
  }, [askOpen, lock, unlock]);

  useEffect(() => () => abort.current?.abort(), []);

  // Keep the newest words in view while the answer streams in.
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns]);

  const run = useCallback(
    async (actions: AskAction[]) => {
      for (const a of actions) {
        if (a.type === "email") {
          try { await navigator.clipboard.writeText(site.email); toast("Email copied"); } catch { /* chip below still shows it */ }
        } else if (a.type === "quick") {
          await sleep(500);
          setAskOpen(false);
          setQuickView(true);
        } else if (a.type === "go") {
          await sleep(500);
          setAskOpen(false);
          await navigate(a.id);
        } else if (a.type === "open") {
          await sleep(500);
          setAskOpen(false);
          await navigate("work");
          window.dispatchEvent(new CustomEvent("open-project", { detail: a.slug }));
        }
      }
    },
    [navigate, setAskOpen, setQuickView, toast],
  );

  const update = (content: string, done = false) =>
    setTurns((t) => {
      const next = t.slice();
      const { clean, actions } = parseActions(content);
      next[next.length - 1] = { role: "assistant", content: clean, actions, done };
      return next;
    });

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    setInput("");
    setBusy(true);
    const history: Turn[] = [...turns, { role: "user", content: q }];
    setTurns([...history, { role: "assistant", content: "" }]);

    let raw = "";
    try {
      abort.current = new AbortController();
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })), hasResume }),
        signal: abort.current.signal,
      });
      if (res.status === 429) {
        raw = (await res.json()).error;
      } else if (res.status === 204 || !res.ok || !res.body) {
        throw new Error("offline");
      } else {
        setMode("live");
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          raw += dec.decode(value, { stream: true });
          update(raw);
        }
        if (!raw.trim()) throw new Error("empty");
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      // No API key or no network: answer from the profile instead, typed out so it feels the same.
      setMode("profile");
      const answer = localAnswer(q, hasResume);
      raw = "";
      for (const word of answer.split(/(?<= )/)) {
        raw += word;
        update(raw);
        await sleep(word.startsWith("[[") ? 0 : 22);
      }
    }
    update(raw, true);
    setBusy(false);
    run(parseActions(raw).actions);
  };

  const started = turns.length > 0;

  return (
    <>
      {/* Once a conversation exists, a small dock lets visitors pick it back up. */}
      {started && !askOpen && (
        <button className="ask-dock" onClick={() => setAskOpen(true)} aria-label="Continue the conversation with Atul’s AI">
          <Image src="/assets/raven.png" alt="" width={28} height={24} />
          <span>Ask a follow-up</span>
          <kbd>⌘K</kbd>
        </button>
      )}

      <div className={`ask${askOpen ? " open" : ""}`} aria-hidden={!askOpen} inert={!askOpen}>
        <div className="ask-scrim" onClick={() => setAskOpen(false)} />
        <section className="ask-panel" role="dialog" aria-modal="true" aria-labelledby="ask-title" data-lenis-prevent>
          <header className="ask-head">
            <span className={`ask-raven${busy ? " thinking" : ""}`}>
              <Image src="/assets/raven.png" alt="" width={40} height={35} />
            </span>
            <div>
              <h2 id="ask-title">Ask about Atul</h2>
              <p>
                {mode === "profile"
                  ? "Answering from his profile"
                  : "An AI that knows his work and can show you around"}
              </p>
            </div>
            <button className="ask-close" onClick={() => setAskOpen(false)} aria-label="Close">
              <kbd>Esc</kbd>
            </button>
          </header>

          <div className="ask-log" ref={logRef} aria-live="polite">
            {!started && (
              <div className="ask-empty">
                <p>
                  Hi. I’m the assistant Atul built into this site. Ask me about his projects, his stack or hiring
                  him, and I can take you straight to the right place.
                </p>
                <div className="ask-chips">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => ask(s)}>{s}</button>
                  ))}
                </div>
              </div>
            )}
            {turns.map((t, i) =>
              t.role === "user" ? (
                <p className="ask-q" key={i}>{t.content}</p>
              ) : (
                <div className="ask-a" key={i}>
                  <p>
                    {t.content}
                    {!t.done && <i className="ask-caret" aria-hidden="true" />}
                  </p>
                  {t.done && !!t.actions?.length && (
                    <div className="ask-receipts">
                      {t.actions.map((a, j) => {
                        if (a.type === "resume")
                          return hasResume ? (
                            <a key={j} className="chip-solid" href={site.resume} target="_blank" rel="noopener">Open resume</a>
                          ) : null;
                        if (a.type === "email")
                          return (
                            <button key={j} className="chip-solid" onClick={() => navigator.clipboard?.writeText(site.email).then(() => toast("Email copied"), () => {})}>
                              {site.email}
                            </button>
                          );
                        const r = receipt(a);
                        return r ? <span key={j} className="chip-note">{r}</span> : null;
                      })}
                    </div>
                  )}
                </div>
              ),
            )}
          </div>

          <form
            className="ask-input"
            onSubmit={(e) => { e.preventDefault(); ask(input); }}
          >
            <label htmlFor="ask-field" className="sr">Your question</label>
            <input
              id="ask-field" ref={inputRef} value={input} maxLength={500} autoComplete="off"
              placeholder={started ? "Ask a follow-up" : "Ask anything about Atul’s work"}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Send">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
