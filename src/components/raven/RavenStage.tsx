"use client";

import type { MotionValue } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { sound } from "@/lib/sound";
import { hasWebGL } from "../tools/spin";
import type { RavenControls } from "./Raven3D";

const Raven3D = dynamic(() => import("./Raven3D"), { ssr: false });

/** Hosts the 3D raven: tracks the pointer across the whole window and flips (with a caw) on click. */
export function RavenStage({ scroll }: { scroll?: MotionValue<number> }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const controls = useRef<RavenControls>({ flipAt: -1e9, pointer: { x: 0, y: 0 } });
  const [mount, setMount] = useState(false);
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    setWebgl(hasWebGL());
    const el = hostRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setMount(true), { rootMargin: "400px" });
    io.observe(el);
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2);
      const y = (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2);
      controls.current.pointer = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
    };
    addEventListener("pointermove", move, { passive: true });
    return () => { io.disconnect(); removeEventListener("pointermove", move); };
  }, []);

  const flip = () => {
    if (performance.now() - controls.current.flipAt < 1100) return;
    controls.current.flipAt = performance.now();
    sound().unlock();
    sound().caw();
  };

  return (
    <div className="raven-stage" ref={hostRef} data-cursor="Poke" onClick={flip} role="button" tabIndex={0} aria-label="3D raven. Click to make it flip." onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), flip())}>
      {mount && webgl && <Raven3D controls={controls} scroll={scroll} />}
      {mount && !webgl && <img className="raven-fallback" src="/assets/raven.png" alt="" />}
      <span className="raven-shadow" aria-hidden="true" />
    </div>
  );
}
