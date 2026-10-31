"use client";

import { useEffect, useRef } from "react";
import { capabilities, facts, projects, site, technologies } from "@/data/site";
import { useSite } from "@/lib/site-context";

/**
 * The 30-second version for recruiters: no animation, everything on one screen, printable.
 * Opens from the hero, the menu, the AI, or a shared link ending in ?view=quick.
 */
export function QuickView() {
  const { quickView, setQuickView, lock, unlock, hasResume, toast } = useSite();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!quickView) return;
    lock("quick");
    document.documentElement.classList.add("quick-open");
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setQuickView(false);
    addEventListener("keydown", onKey);
    return () => {
      unlock("quick");
      document.documentElement.classList.remove("quick-open");
      removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [quickView, lock, unlock, setQuickView]);

  if (!quickView) return null;

  const known = facts.filter((f) => f.value.trim());
  const share = async () => {
    const url = `${location.origin}${location.pathname}?view=quick`;
    try { await navigator.clipboard.writeText(url); toast("Link copied"); } catch { toast(url); }
  };
  const openDemo = (slug: string) => {
    setQuickView(false);
    window.dispatchEvent(new CustomEvent("open-project", { detail: slug }));
  };

  return (
    <div className="quick" role="dialog" aria-modal="true" aria-labelledby="quick-title" data-lenis-prevent>
      <div className="quick-inner">
        <div className="quick-bar">
          <span>Recruiter view</span>
          <div>
            <button onClick={share}>Copy link</button>
            <button onClick={() => print()}>Print</button>
            <button className="quick-close" ref={closeRef} onClick={() => setQuickView(false)}>
              Open the full site
            </button>
          </div>
        </div>

        <header className="quick-head">
          <h1 id="quick-title">{site.name}</h1>
          <p className="quick-role">{site.role}, based in India</p>
          <p className="quick-avail"><i />{site.availability}</p>
          <div className="quick-actions">
            <a className="q-primary" href={`mailto:${site.email}`}>Email {site.email}</a>
            {hasResume && <a href={site.resume} target="_blank" rel="noopener">Resume (PDF)</a>}
            <a href={site.github} target="_blank" rel="noopener">GitHub</a>
            <a href={site.linkedin} target="_blank" rel="noopener">LinkedIn</a>
          </div>
        </header>

        <div className="quick-grid">
          <div className="quick-side">
            <h2>About</h2>
            <p>{site.statement}</p>
            {known.length > 0 && (
              <dl className="quick-facts">
                {known.map((f) => (
                  <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>
                ))}
              </dl>
            )}
            <h2>Strengths</h2>
            <ul className="quick-list">
              {capabilities.map((c) => <li key={c.title}><b>{c.title}.</b> {c.detail}</li>)}
            </ul>
            <h2>Stack</h2>
            <p className="quick-stack">{technologies.join(", ")}</p>
          </div>

          <div>
            <h2>Projects</h2>
            <ul className="quick-projects">
              {projects.map((p) => (
                <li key={p.slug}>
                  <div className="qp-head">
                    <h3>{p.name}</h3>
                    <span>{p.kind}</span>
                  </div>
                  <p>{p.summary}</p>
                  <p className="qp-result"><b>Result:</b> {p.metric}</p>
                  <p className="qp-stack">{p.stack.join(", ")}</p>
                  <p className="qp-links">
                    {p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noopener">Live site</a>}
                    {p.sourceUrl && <a href={p.sourceUrl} target="_blank" rel="noopener">Source</a>}
                    {p.demo && <button onClick={() => openDemo(p.slug)}>Try the demo</button>}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
