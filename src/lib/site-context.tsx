"use client";

import Lenis from "lenis";
import { animate } from "motion/react";
import Image from "next/image";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { site } from "@/data/site";
import { EASE_IN_OUT, prefersReducedMotion } from "./motion";

type SiteContextValue = {
  /** Increments every time the intro finishes, so sections can replay their entrance. */
  introRun: number;
  introActive: boolean;
  finishIntro: () => void;
  replayIntro: () => void;
  /** Scroll to a section id ("top" for the page top) behind a full-screen swipe. */
  navigate: (id: string) => void;
  scrollTo: (id: string, immediate?: boolean) => void;
  lock: (reason: string) => void;
  unlock: (reason: string) => void;
  toast: (message: string) => void;
  /** The no-animation one-screen summary for recruiters. Also opens from ?view=quick. */
  quickView: boolean;
  setQuickView: (open: boolean) => void;
  /** The “Ask Atul” AI panel. */
  askOpen: boolean;
  setAskOpen: (open: boolean) => void;
  /** True once public/resume.pdf is confirmed to exist. */
  hasResume: boolean;
};

const SiteContext = createContext<SiteContextValue | null>(null);

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used inside <SiteProvider>");
  return ctx;
}

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const locks = useRef(new Set<string>(["intro"]));
  const swipeRef = useRef<HTMLDivElement>(null);
  const swiping = useRef(false);
  const [introRun, setIntroRun] = useState(0);
  const [introActive, setIntroActive] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>(0);
  const [quickView, setQuickViewState] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [hasResume, setHasResume] = useState(false);

  // Open the recruiter view straight from a shared link (?view=quick).
  useEffect(() => {
    if (new URLSearchParams(location.search).get("view") === "quick") setQuickViewState(true);
  }, []);

  // Only show resume buttons once the file actually exists, so there’s never a dead link.
  useEffect(() => {
    if (!site.resume) return;
    fetch(site.resume, { method: "HEAD" })
      .then((r) => setHasResume(r.ok && !(r.headers.get("content-type") ?? "").includes("text/html")))
      .catch(() => {});
  }, []);

  const setQuickView = useCallback((open: boolean) => {
    setQuickViewState(open);
    const url = new URL(location.href);
    if (open) url.searchParams.set("view", "quick");
    else url.searchParams.delete("view");
    history.replaceState(null, "", url);
  }, []);

  const applyLock = useCallback(() => {
    const locked = locks.current.size > 0;
    document.documentElement.classList.toggle("is-locked", locked);
    if (locked) lenisRef.current?.stop();
    else lenisRef.current?.start();
  }, []);

  useEffect(() => {
    if (!prefersReducedMotion()) {
      const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
      lenisRef.current = lenis;
      let frame = 0;
      const raf = (t: number) => {
        lenis.raf(t);
        frame = requestAnimationFrame(raf);
      };
      frame = requestAnimationFrame(raf);
      applyLock();
      return () => {
        cancelAnimationFrame(frame);
        lenis.destroy();
        lenisRef.current = null;
      };
    }
    applyLock();
  }, [applyLock]);

  const lock = useCallback((reason: string) => {
    locks.current.add(reason);
    applyLock();
  }, [applyLock]);

  const unlock = useCallback((reason: string) => {
    locks.current.delete(reason);
    applyLock();
  }, [applyLock]);

  const scrollTo = useCallback((id: string, immediate = false) => {
    const target = id === "top" ? 0 : document.getElementById(id);
    if (target === null) return;
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(target, { immediate, force: true, duration: 1.4 });
    } else if (target === 0) {
      window.scrollTo(0, 0);
    } else {
      target.scrollIntoView();
    }
  }, []);

  const navigate = useCallback(async (id: string) => {
    const el = swipeRef.current;
    if (!el || prefersReducedMotion() || swiping.current) {
      scrollTo(id, true);
      return;
    }
    swiping.current = true;
    await animate(el, { x: ["-101%", "0%"] }, { duration: 0.6, ease: EASE_IN_OUT });
    scrollTo(id, true);
    await new Promise((r) => setTimeout(r, 120));
    await animate(el, { x: ["0%", "101%"] }, { duration: 0.6, ease: EASE_IN_OUT });
    el.style.transform = "translateX(-101%)";
    swiping.current = false;
  }, [scrollTo]);

  const finishIntro = useCallback(() => {
    setIntroActive(false);
    setIntroRun((n) => n + 1);
    unlock("intro");
  }, [unlock]);

  const replayIntro = useCallback(() => {
    scrollTo("top", true);
    lock("intro");
    setIntroActive(true);
  }, [lock, scrollTo]);

  const toast = useCallback((message: string) => {
    setToastMsg(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2200);
  }, []);

  const value = useMemo(
    () => ({
      introRun, introActive, finishIntro, replayIntro, navigate, scrollTo, lock, unlock, toast,
      quickView, setQuickView, askOpen, setAskOpen, hasResume,
    }),
    [introRun, introActive, finishIntro, replayIntro, navigate, scrollTo, lock, unlock, toast, quickView, setQuickView, askOpen, hasResume],
  );

  return (
    <SiteContext.Provider value={value}>
      {children}
      <div className="swipe" ref={swipeRef} aria-hidden="true">
        <Image src="/assets/raven.png" alt="" width={120} height={104} priority />
      </div>
      <div className={`toast${toastMsg ? " show" : ""}`} role="status" aria-live="polite">
        {toastMsg}
      </div>
    </SiteContext.Provider>
  );
}
