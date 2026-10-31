"use client";

import { animate, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSite } from "@/lib/site-context";
import { EASE_OUT, prefersReducedMotion } from "@/lib/motion";
import { RollText } from "./RollText";

// Snappy loader: 1.5s fallback so recruiters are never held hostage.
const DARK_TEXT_AFTER = 0.9;
const FALLBACK_DURATION = 1.6;

/** One rolling digit column (0–9). */
function Digit({ value }: { value: number }) {
  return (
    <span className="digit">
      <motion.span className="digit-col" animate={{ y: `${-value * 10}%` }} transition={{ type: "spring", stiffness: 280, damping: 30 }}>
        {Array.from({ length: 10 }, (_, i) => <span key={i}>{i}</span>)}
      </motion.span>
    </span>
  );
}

function Odometer({ value }: { value: number }) {
  const digits = String(value).padStart(value >= 100 ? 3 : 2, "0").split("").map(Number);
  return (
    <span className="odometer" aria-hidden="true">
      {digits.map((d, i) => <Digit key={digits.length - i} value={d} />)}
      <sup>%</sup>
    </span>
  );
}

/**
 * Full-screen intro: the loading video with a rolling % counter, then a three-colour wipe.
 * Plays on every page load (including hard refresh) and when "Replay intro" is pressed.
 */
export function Loader() {
  const { introActive, finishIntro, introRun } = useSite();
  const [visible, setVisible] = useState(true);
  const [count, setCount] = useState(0);
  const [darkText, setDarkText] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wipesRef = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  const shown = useRef(0);

  // Always start a fresh load from the top, so a refresh never lands mid-page under the loader.
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, []);

  const finish = useCallback(async () => {
    if (done.current) return;
    done.current = true;
    try {
      sessionStorage.setItem("atul_intro_seen", "1");
    } catch {}
    setCount(100);
    const wipes = Array.from(wipesRef.current?.children ?? []) as HTMLElement[];
    if (prefersReducedMotion() || wipes.length === 0) {
      setVisible(false);
      finishIntro();
      return;
    }
    await Promise.all(
      wipes.map((w, i) => animate(w, { y: ["100%", "0%"] }, { duration: 0.5, delay: i * 0.06, ease: EASE_OUT })),
    );
    videoRef.current?.pause();
    setVisible(false);
    window.scrollTo(0, 0);
    finishIntro();
    [...wipes].reverse().forEach((w, i) =>
      animate(w, { y: ["0%", "-100%"] }, { duration: 0.65, delay: i * 0.06, ease: EASE_OUT }),
    );
  }, [finishIntro]);

  useEffect(() => {
    if (!introActive) return;
    done.current = false;
    shown.current = 0;
    setVisible(true);
    setCount(0);
    setDarkText(false);
    wipesRef.current?.querySelectorAll<HTMLElement>("i").forEach((w) => (w.style.transform = "translateY(100%)"));

    let alreadySeen = false;
    try { alreadySeen = sessionStorage.getItem("atul_intro_seen") === "1"; } catch {}
    // Recruiters arriving on a ?view=quick link go straight to the summary, no intro.
    const quickLink = new URLSearchParams(location.search).get("view") === "quick";
    if ((alreadySeen || quickLink) && introRun === 0) {
      // User has already visited this session: skip immediately without blocking
      setVisible(false);
      finishIntro();
      return;
    }

    if (prefersReducedMotion()) {
      const t = setTimeout(finish, 200);
      return () => clearTimeout(t);
    }

    const start = performance.now();
    let frame = 0;
    const tryPlay = () => {
      const v = videoRef.current;
      if (v && v.paused) {
        v.playbackRate = 1.4;
        v.currentTime = 0;
        v.play().catch(() => {});
      }
    };
    tryPlay();
    const tick = () => {
      if (done.current) return;
      const v = videoRef.current;
      if (v && v.paused && performance.now() - start < 1000) tryPlay();
      const playing = !!v && !v.paused && !!v.duration;
      const elapsed = (performance.now() - start) / 1000;
      const t = playing ? v!.currentTime : elapsed;
      const pct = playing ? (v!.currentTime / (v!.duration - 0.4)) * 100 : (elapsed / FALLBACK_DURATION) * 100;
      shown.current = Math.max(shown.current, Math.min(100, pct));
      setCount(Math.round(shown.current));
      setDarkText(t > DARK_TEXT_AFTER);
      if (shown.current >= 100) return void finish();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [introActive, introRun, finish, finishIntro]);

  return (
    <>
      {visible && (
        <div className={`loader${darkText ? " dark" : ""}`} role="progressbar" aria-label="Loading" aria-valuenow={count} aria-valuemin={0} aria-valuemax={100}>
          <video ref={videoRef} src="/assets/intro-loader.mp4" muted playsInline autoPlay preload="auto" />
          <div className="count"><Odometer value={count} /></div>
          <button className="skip" onClick={finish}><RollText>Skip intro</RollText></button>
          <div className="bar" style={{ transform: `scaleX(${count / 100})` }} />
        </div>
      )}
      <div className="wipes" ref={wipesRef} aria-hidden="true"><i /><i /><i /></div>
    </>
  );
}
