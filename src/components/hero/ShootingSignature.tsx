"use client";

import { useInView } from "motion/react";
import { useEffect, useId, useRef } from "react";
import { SIGNATURE_PATH, SIGNATURE_VIEWBOX } from "@/data/signature";
import { prefersReducedMotion } from "@/lib/motion";

const X0 = -130, X1 = 3740, WRITE = 2.6;
const ease = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;

/** SVG signature written left to right by a shooting star with a glowing tail and sparks. */
export function ShootingSignature({ className }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const clipRef = useRef<SVGRectElement>(null);
  const headRef = useRef<SVGCircleElement>(null);
  const tailRef = useRef<SVGPolylineElement>(null);
  const sparksRef = useRef<SVGGElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const id = useId().replace(/:/g, "");

  useEffect(() => {
    if (!inView) return;
    const clip = clipRef.current, head = headRef.current, tail = tailRef.current, sparks = sparksRef.current;
    if (!clip || !head || !tail || !sparks) return;
    if (prefersReducedMotion()) { clip.setAttribute("width", "5000"); return; }
    const start = performance.now();
    const trail: [number, number][] = [];
    let frame = 0;
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      const u = Math.min(1, t / WRITE);
      const x = X0 + (X1 - X0) * ease(u);
      const y = 640 - Math.sin(Math.PI * u) * 150 + Math.sin(u * 18) * 60;
      clip.setAttribute("width", String(x - X0 + 200));
      if (u < 1) {
        trail.push([x, y]);
        if (trail.length > 22) trail.shift();
        head.setAttribute("cx", String(x)); head.setAttribute("cy", String(y)); head.setAttribute("opacity", "1");
        if (Math.random() < 0.6) {
          const s = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          s.setAttribute("cx", String(x)); s.setAttribute("cy", String(y)); s.setAttribute("r", String(6 + Math.random() * 10));
          s.setAttribute("class", Math.random() < 0.5 ? "spark lime" : "spark lilac");
          s.style.setProperty("--dx", `${(Math.random() - 0.5) * 140}px`);
          s.style.setProperty("--dy", `${40 + Math.random() * 120}px`);
          sparks.appendChild(s);
          setTimeout(() => s.remove(), 900);
        }
      } else {
        trail.shift();
        head.setAttribute("opacity", String(Math.max(0, 1 - (t - WRITE) * 3)));
      }
      tail.setAttribute("points", trail.map((p) => p.join(",")).join(" "));
      if (u < 1 || trail.length) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView]);

  return (
    <svg ref={ref} className={`shooting-sig ${className ?? ""}`} viewBox={SIGNATURE_VIEWBOX} aria-hidden="true">
      <defs>
        <clipPath id={`clip-${id}`}><rect ref={clipRef} x={X0 - 200} y={-2000} width={0} height={5000} /></clipPath>
        <radialGradient id={`glow-${id}`}>
          <stop offset="0" stopColor="#fff" />
          <stop offset=".3" stopColor="#C9F28C" />
          <stop offset="1" stopColor="#C9F28C" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path className="sig-ink" d={SIGNATURE_PATH} clipPath={`url(#clip-${id})`} />
      <polyline ref={tailRef} className="sig-tail" points="" />
      <g ref={sparksRef} />
      <circle ref={headRef} r={70} fill={`url(#glow-${id})`} opacity={0} />
    </svg>
  );
}
