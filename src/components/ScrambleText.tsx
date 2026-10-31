"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

const GLYPHS = "abcdefghijklmnopqrstuvwxyz/<>*+=#_";

/** Decodes text left to right through random glyphs, like a signal coming in. */
export function ScrambleText({ text, play, delay = 0, duration = 1.1, className }: { text: string; play: boolean; delay?: number; duration?: number; className?: string }) {
  const [out, setOut] = useState(text);

  useEffect(() => {
    if (!play || prefersReducedMotion()) { setOut(text); return; }
    let frame = 0;
    const start = performance.now() + delay * 1000;
    setOut(text.replace(/\S/g, " "));
    const tick = (now: number) => {
      const t = (now - start) / (duration * 1000);
      if (t < 0) { frame = requestAnimationFrame(tick); return; }
      if (t >= 1) { setOut(text); return; }
      const settled = Math.floor(t * text.length);
      setOut(
        [...text].map((ch, i) => (ch === " " || i < settled ? ch : i < settled + 8 ? GLYPHS[(Math.random() * GLYPHS.length) | 0] : " ")).join(""),
      );
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [text, play, delay, duration]);

  return <span className={className} aria-label={text}><span aria-hidden="true">{out}</span></span>;
}
