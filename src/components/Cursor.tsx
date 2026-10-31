"use client";

import { useEffect, useRef, useState } from "react";
import { hasFinePointer } from "@/lib/motion";

/**
 * Lagging ring + dot cursor. Grows over links and buttons, and shows a label
 * over any element with a data-cursor attribute (e.g. data-cursor="Open").
 */
export function Cursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<{ mode: "idle" | "hover" | "label"; label: string }>({ mode: "idle", label: "" });

  useEffect(() => {
    if (!hasFinePointer()) return;
    document.documentElement.classList.add("has-cursor");
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my, frame = 0;
    const move = (e: PointerEvent) => { mx = e.clientX; my = e.clientY; };
    const over = (e: PointerEvent) => {
      const t = e.target as Element | null;
      const labelled = t?.closest<HTMLElement>("[data-cursor]");
      if (labelled) return setState({ mode: "label", label: labelled.dataset.cursor ?? "" });
      setState({ mode: t?.closest("a,button,[data-cursor-hover]") ? "hover" : "idle", label: "" });
    };
    const loop = () => {
      cx += (mx - cx) * 0.18;
      cy += (my - cy) * 0.18;
      if (ringRef.current) ringRef.current.style.transform = `translate(${cx}px,${cy}px)`;
      if (dotRef.current) dotRef.current.style.transform = `translate(${mx}px,${my}px)`;
      frame = requestAnimationFrame(loop);
    };
    addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over);
    frame = requestAnimationFrame(loop);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className={`cursor ${state.mode}`} aria-hidden="true">
      <div className="cursor-ring-pos" ref={ringRef}>
        <div className="ring"><span>{state.label}</span></div>
      </div>
      <div className="cursor-dot-pos" ref={dotRef}><div className="dot" /></div>
    </div>
  );
}
