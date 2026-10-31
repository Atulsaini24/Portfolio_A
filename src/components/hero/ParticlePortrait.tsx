"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

type Particle = {
  tx: number; ty: number; x: number; y: number; vx: number; vy: number;
  size: number; k: number; delay: number; phase: number;
};

type Rgb = [number, number, number];
const DEEP: Rgb = [110, 95, 214];
const LILAC: Rgb = [176, 161, 249];
const BONE: Rgb = [241, 243, 234];
const LIME: Rgb = [201, 242, 140];
const mix = (a: Rgb, b: Rgb, t: number): Rgb => a.map((v, i) => Math.round(v + (b[i] - v) * t)) as Rgb;

/** Brightness → brand duotone: shadows lilac, mid-tones bone, highlights lime. */
function toneFor(lum: number): Rgb {
  if (lum < 0.45) return mix(DEEP, LILAC, lum / 0.45);
  if (lum < 0.78) return mix(LILAC, BONE, (lum - 0.45) / 0.33);
  return mix(BONE, LIME, (lum - 0.78) / 0.22);
}

/**
 * Halftone particle portrait. Particles drift until `assembled` turns true, then fly into
 * place. They flee the pointer, and a click scatters them before they rebuild.
 * Source: /public/assets/portrait-particles.png (grayscale cut-out with a faded bottom edge).
 */
export function ParticlePortrait({ assembled, src = "/assets/portrait-particles.png" }: { assembled: boolean; src?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const assembledRef = useRef(assembled);
  const rebuildRef = useRef<() => void>(() => {});

  useEffect(() => {
    assembledRef.current = assembled;
    if (assembled) rebuildRef.current();
  }, [assembled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;

    const reduce = prefersReducedMotion();
    const img = new Image();
    img.src = src;
    let W = 0, H = 0, particles: Particle[] = [], buckets: [string, Particle[]][] = [];
    let visible = true, frame = 0, tick = 0, alive = true;
    const pointer = { x: -9999, y: -9999, active: false };

    const build = () => {
      const rect = host.getBoundingClientRect();
      W = rect.width; H = rect.height;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!img.complete || !img.naturalWidth) return;

      const mobile = W < 760;
      const ph = mobile ? H * 0.6 : Math.min(H * 0.92, 940);
      const pw = (ph * img.naturalWidth) / img.naturalHeight;
      const ox = mobile ? (W - pw) / 2 : W - pw - W * 0.07;
      const oy = mobile ? H * 0.08 : H - ph;
      const gap = mobile ? 4 : W > 1600 ? 5 : 4;
      const sw = Math.round(pw / gap), sh = Math.round(ph / gap);

      const off = document.createElement("canvas");
      off.width = sw; off.height = sh;
      const o = off.getContext("2d", { willReadFrequently: true });
      if (!o) return;
      o.drawImage(img, 0, 0, sw, sh);
      const data = o.getImageData(0, 0, sw, sh).data;

      const previous = particles;
      const next: Particle[] = [];
      const groups = new Map<string, Particle[]>();
      for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
          const i = (y * sw + x) * 4;
          if (data[i + 3] < 40) continue;
          const lum = data[i] / 255;
          const alpha = data[i + 3] / 255;
          const key = toneFor(lum).map((v) => Math.round(v / 20) * 20).join(",");
          const prev = previous[next.length];
          const ty = oy + y * gap;
          const p: Particle = {
            tx: ox + x * gap, ty,
            x: prev ? prev.x : Math.random() * W,
            y: prev ? prev.y : Math.random() * H,
            vx: 0, vy: 0,
            size: gap * (0.22 + lum * 0.7) * (0.35 + alpha * 0.65),
            k: 0.018 + Math.random() * 0.03,
            delay: prev ? 0 : Math.random() * 60 + ((ty - oy) / ph) * 50,
            phase: Math.random() * Math.PI * 2,
          };
          if (reduce) { p.x = p.tx; p.y = p.ty; p.delay = 0; }
          next.push(p);
          const g = groups.get(key);
          if (g) g.push(p); else groups.set(key, [p]);
        }
      }
      particles = next;
      buckets = [...groups.entries()].map(([c, arr]) => [`rgb(${c})`, arr]);
    };
    rebuildRef.current = build;

    const step = () => {
      if (!alive) return;
      frame = requestAnimationFrame(step);
      if (!visible) return;
      tick++;
      ctx.clearRect(0, 0, W, H);
      const R = W < 760 ? 70 : 120, R2 = R * R;
      const together = assembledRef.current || reduce;
      for (const p of particles) {
        if (!together) {
          p.x += Math.sin(tick * 0.01 + p.phase) * 0.3;
          p.y += Math.cos(tick * 0.012 + p.phase) * 0.3;
          continue;
        }
        if (p.delay > 0) { p.delay--; continue; }
        let ax = (p.tx - p.x) * p.k, ay = (p.ty - p.y) * p.k;
        if (pointer.active) {
          const dx = p.x - pointer.x, dy = p.y - pointer.y, dd = dx * dx + dy * dy;
          if (dd < R2) {
            const f = (1 - dd / R2) * 6, dl = Math.sqrt(dd) || 1;
            ax += (dx / dl) * f; ay += (dy / dl) * f;
          }
        }
        p.vx = (p.vx + ax) * 0.82; p.vy = (p.vy + ay) * 0.82;
        p.x += p.vx; p.y += p.vy;
      }
      for (const [color, arr] of buckets) {
        ctx.fillStyle = color;
        for (const p of arr) {
          const s = reduce ? p.size : p.size * (1 + Math.sin(tick * 0.04 + p.phase) * 0.12);
          ctx.fillRect(p.x, p.y, s, s);
        }
      }
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.active = true;
    };
    const onLeave = () => (pointer.active = false);
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element).closest("a,button") || reduce) return;
      const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      for (const p of particles) {
        const dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy) || 1, f = 2200 / (d + 60);
        p.vx += (dx / d) * f + (Math.random() - 0.5) * 6;
        p.vy += (dy / d) * f + (Math.random() - 0.5) * 6;
      }
    };
    let resizeTimer = 0;
    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = window.setTimeout(build, 150); };
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));

    img.onload = () => { build(); frame = requestAnimationFrame(step); };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    host.addEventListener("click", onClick);
    addEventListener("resize", onResize);
    io.observe(host);

    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("click", onClick);
      removeEventListener("resize", onResize);
      io.disconnect();
    };
  }, [src]);

  return <canvas ref={canvasRef} className="particles" role="img" aria-label="Portrait of Atul Saini made of particles. Move your cursor through it, or click to scatter it." />;
}
