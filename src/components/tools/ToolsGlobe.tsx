"use client";

import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { technologies, toolNotes } from "@/data/site";
import { RevealText } from "../RevealText";
import { hasWebGL, type Spin } from "./spin";

const Globe3D = dynamic(() => import("./Globe3D"), { ssr: false });
const Globe2D = dynamic(() => import("./Globe2D"), { ssr: false });

export function ToolsGlobe() {
  const hostRef = useRef<HTMLDivElement>(null);
  const spin = useRef<Spin>({ vx: 0.0035, vy: 0, dragging: false });
  const last = useRef({ x: 0, y: 0 });
  const [mode, setMode] = useState<"3d" | "2d" | null>(null);
  const [inView, setInView] = useState(false);
  const [hot, setHot] = useState<string | null>(null);

  useEffect(() => {
    setMode(hasWebGL() ? "3d" : "2d");
    const el = hostRef.current;
    if (!el) return;
    // Mount the globe only once it is near the viewport, so it never slows the first load.
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    spin.current.dragging = true;
    last.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    const s = spin.current;
    if (!s.dragging) return;
    s.vx = (e.clientX - last.current.x) * 0.0009 + s.vx * 0.5;
    s.vy = (e.clientY - last.current.y) * 0.0009 + s.vy * 0.5;
    last.current = { x: e.clientX, y: e.clientY };
  };
  const up = () => { spin.current.dragging = false; };

  return (
    <section className="tools" id="tools">
      <div className="wrap tools-grid">
        <div>
          <RevealText className="h2" lines={["Tools I", "reach for"]} />
          <p className="lead">The stack behind the work. Drag the globe to spin it, and hover or tap a tool to see what I use it for.</p>
          <div className="tool-note" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.p
                key={hot ?? "none"}
                initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                transition={{ duration: 0.35 }}
              >
                {hot ? <><b>{hot}</b>{toolNotes[hot] ?? ""}</> : <span className="muted">Nothing selected yet.</span>}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
        <div
          className="globe" ref={hostRef} data-cursor="Drag"
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
          role="img" aria-label={`Interactive globe of the tools Atul uses: ${technologies.join(", ")}`}
        >
          {inView && mode === "3d" && <Globe3D items={technologies} spin={spin} onHover={setHot} />}
          {inView && mode === "2d" && <Globe2D items={technologies} spin={spin} onHover={setHot} />}
        </div>
      </div>
    </section>
  );
}
