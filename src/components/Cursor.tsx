"use client";

import { useEffect, useRef, useState } from "react";
import { hasFinePointer } from "@/lib/motion";

/**
 * Lagging ring + dot cursor. The ring stretches in the direction you move, grows over links
 * and buttons, and shows a label over any element with data-cursor="Label".
 * Canvases can also set a label with: window.dispatchEvent(new CustomEvent("cursorlabel", { detail: "Click" })).
 */
export function Cursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<{ mode: "idle" | "hover" | "label" | "down"; label: string }>({ mode: "idle", label: "" });
  const override = useRef<string | null>(null);
  const labelled = useRef(false);
  labelled.current = state.mode === "label";

  useEffect(() => {
    if (!hasFinePointer()) return;
    document.documentElement.classList.add("has-cursor");
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my, frame = 0, lastTarget: Element | null = null;

    const resolve = (t: Element | null) => {
      if (override.current) return setState({ mode: "label", label: override.current });
      const labelled = t?.closest<HTMLElement>("[data-cursor]");
      if (labelled) return setState({ mode: "label", label: labelled.dataset.cursor ?? "" });
      setState({ mode: t?.closest("a,button,[data-cursor-hover]") ? "hover" : "idle", label: "" });
    };
    const move = (e: PointerEvent) => { mx = e.clientX; my = e.clientY; };
    const over = (e: PointerEvent) => { lastTarget = e.target as Element; resolve(lastTarget); };
    const label = (e: Event) => { override.current = (e as CustomEvent<string | null>).detail; resolve(lastTarget); };
    const down = () => ringRef.current?.classList.add("pressed");
    const up = () => ringRef.current?.classList.remove("pressed");

    const loop = () => {
      const dx = mx - cx, dy = my - cy;
      cx += dx * 0.18; cy += dy * 0.18;
      const speed = Math.min(Math.hypot(dx, dy), 140);
      const angle = Math.atan2(dy, dx) * 57.2958;
      const stretch = labelled.current ? 1 : 1 + speed / 260;
      if (ringRef.current) ringRef.current.style.transform = `translate(${cx}px,${cy}px) rotate(${labelled.current ? 0 : angle}deg) scale(${stretch},${1 / stretch})`;
      if (dotRef.current) dotRef.current.style.transform = `translate(${mx}px,${my}px)`;
      frame = requestAnimationFrame(loop);
    };
    addEventListener("pointermove", move, { passive: true });
    addEventListener("pointerdown", down);
    addEventListener("pointerup", up);
    addEventListener("cursorlabel", label);
    document.addEventListener("pointerover", over);
    frame = requestAnimationFrame(loop);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      removeEventListener("pointermove", move);
      removeEventListener("pointerdown", down);
      removeEventListener("pointerup", up);
      removeEventListener("cursorlabel", label);
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
