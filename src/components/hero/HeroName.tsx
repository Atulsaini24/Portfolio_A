"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { EASE_OUT, hasFinePointer, prefersReducedMotion } from "@/lib/motion";

/**
 * The name, split into letters that rise in on intro. On desktop, letters near the
 * cursor swell in weight and turn lime (Bricolage Grotesque's variable axes).
 */
export function HeroName({ name, run }: { name: string; run: number }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const lines = name.split(" ");

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasFinePointer() || prefersReducedMotion()) return;
    const letters = Array.from(el.querySelectorAll<HTMLSpanElement>(".l"));
    let raf = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        for (const l of letters) {
          const r = l.getBoundingClientRect();
          const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
          const f = Math.max(0, 1 - d / 320);
          l.style.fontVariationSettings = `"wght" ${300 + f * 500}, "wdth" ${80 - f * 5}`;
          l.style.color = f > 0.55 ? "var(--lime)" : "";
        }
      });
    };
    const leave = () => letters.forEach((l) => { l.style.fontVariationSettings = ""; l.style.color = ""; });
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); cancelAnimationFrame(raf); };
  }, [run]);

  let index = 0;
  return (
    <h1 className="name" ref={ref}>
      <span className="sr">{name}</span>
      {lines.map((line) => (
        <span className="line" aria-hidden="true" key={`${line}-${run}`}>
          {[...line].map((ch) => {
            const i = index++;
            return (
              <motion.span
                className="l"
                key={i}
                initial={{ y: "105%" }}
                animate={run > 0 ? { y: "0%" } : undefined}
                transition={{ duration: 1.1, delay: 0.15 + i * 0.05, ease: EASE_OUT }}
              >
                {ch}
              </motion.span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}
