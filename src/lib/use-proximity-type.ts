"use client";

import { useEffect } from "react";
import { hasFinePointer, prefersReducedMotion } from "./motion";

type Options = { base: number; max: number; wdth?: [number, number]; radius?: number; pull?: number; tint?: boolean };

/**
 * Letters near the cursor swell in weight (variable font), lean toward it and turn lime.
 * `selector` picks the letter spans inside `ref`.
 */
export function useProximityType(ref: React.RefObject<HTMLElement | null>, selector: string, opts: Options, deps: unknown[] = []) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !hasFinePointer() || prefersReducedMotion()) return;
    const letters = Array.from(el.querySelectorAll<HTMLElement>(selector));
    const { base, max, wdth = [80, 75], radius = 320, pull = 10, tint = true } = opts;
    letters.forEach((l) => (l.style.transition = "font-variation-settings .45s cubic-bezier(.22,1,.36,1), color .3s, translate .5s cubic-bezier(.22,1,.36,1)"));
    let raf = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        for (const l of letters) {
          const r = l.getBoundingClientRect();
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          const d = Math.hypot(e.clientX - cx, e.clientY - cy);
          const f = Math.max(0, 1 - d / radius);
          l.style.fontVariationSettings = `"wght" ${base + f * (max - base)}, "wdth" ${wdth[0] + f * (wdth[1] - wdth[0])}`;
          l.style.translate = `${((e.clientX - cx) / radius) * pull * f}px ${((e.clientY - cy) / radius) * pull * f}px`;
          if (tint) l.style.color = f > 0.55 ? "var(--lime)" : "";
        }
      });
    };
    const leave = () => letters.forEach((l) => { l.style.fontVariationSettings = ""; l.style.color = ""; l.style.translate = ""; });
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
