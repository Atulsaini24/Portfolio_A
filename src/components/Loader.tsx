"use client";

import { animate } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSite } from "@/lib/site-context";
import { EASE_OUT, prefersReducedMotion } from "@/lib/motion";
import { RollText } from "./RollText";

const SEEN_KEY = "atul-intro-seen";
// The loader video's background is forest green until 2.2s, then lime / lilac.
const DARK_TEXT_AFTER = 2.2;
const FALLBACK_DURATION = 5.2;

export function Loader() {
  const { introActive, introRun, finishIntro } = useSite();
  const [visible, setVisible] = useState(true);
  const [count, setCount] = useState(0);
  const [darkText, setDarkText] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wipesRef = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  const shown = useRef(0);

  const finish = useCallback(async () => {
    if (done.current) return;
    done.current = true;
    setCount(100);
    try { sessionStorage.setItem(SEEN_KEY, "1"); } catch {}
    const wipes = Array.from(wipesRef.current?.children ?? []) as HTMLElement[];
    if (prefersReducedMotion() || wipes.length === 0) {
      setVisible(false);
      finishIntro();
      return;
    }
    await Promise.all(
      wipes.map((w, i) => animate(w, { y: ["100%", "0%"] }, { duration: 0.7, delay: i * 0.09, ease: EASE_OUT })),
    );
    videoRef.current?.pause();
    setVisible(false);
    window.scrollTo(0, 0);
    finishIntro();
    [...wipes].reverse().forEach((w, i) =>
      animate(w, { y: ["0%", "-100%"] }, { duration: 0.8, delay: i * 0.08, ease: EASE_OUT }),
    );
  }, [finishIntro]);

  // (Re)start whenever the intro becomes active (first load or "Replay intro").
  useEffect(() => {
    if (!introActive) return;
    done.current = false;
    shown.current = 0;
    setVisible(true);
    setCount(0);
    setDarkText(false);
    wipesRef.current?.querySelectorAll<HTMLElement>("i").forEach((w) => (w.style.transform = "translateY(100%)"));

    let seen = false;
    try { seen = sessionStorage.getItem(SEEN_KEY) === "1"; } catch {}
    // Returning visitors in the same tab skip the video; "Replay intro" always plays it.
    const isReplay = introRun > 0;
    if (prefersReducedMotion() || (seen && !isReplay)) {
      const t = setTimeout(finish, 250);
      return () => clearTimeout(t);
    }

    const video = videoRef.current;
    const start = performance.now();
    let frame = 0;
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {});
    }
    const tick = () => {
      if (done.current) return;
      const v = videoRef.current;
      const playing = !!v && !v.paused && !!v.duration;
      const elapsed = (performance.now() - start) / 1000;
      const t = playing ? v!.currentTime : elapsed;
      const pct = playing ? (v!.currentTime / (v!.duration - 0.9)) * 100 : (elapsed / FALLBACK_DURATION) * 100;
      shown.current = Math.max(shown.current, Math.min(100, pct));
      setCount(Math.round(shown.current));
      setDarkText(t > DARK_TEXT_AFTER);
      if (shown.current >= 100) return void finish();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // introRun is read only to tell a replay from the first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introActive, finish]);

  return (
    <>
      {visible && (
        <div className={`loader${darkText ? " dark" : ""}`} aria-label="Loading" role="progressbar" aria-valuenow={count} aria-valuemin={0} aria-valuemax={100}>
          <video ref={videoRef} src="/assets/intro-loader.mp4" muted playsInline preload="auto" />
          <div className="count" aria-hidden="true">{count}<sup>%</sup></div>
          <button className="skip" onClick={finish}><RollText>Skip intro</RollText></button>
          <div className="bar" style={{ transform: `scaleX(${count / 100})` }} />
        </div>
      )}
      <div className="wipes" ref={wipesRef} aria-hidden="true"><i /><i /><i /></div>
    </>
  );
}
