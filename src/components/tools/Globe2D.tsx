"use client";

import { useEffect, useRef } from "react";
import type { Spin } from "./spin";
import { fibonacciSphere } from "./spin";

/** Canvas 2D version of the tools globe for devices without WebGL. Same look, same controls. */
export default function Globe2D({ items, spin, onHover }: { items: string[]; spin: React.RefObject<Spin>; onHover: (t: string | null) => void }) {
  const hoverRef = useRef(onHover);
  hoverRef.current = onHover;
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current, c = cv?.getContext("2d"), host = cv?.parentElement;
    if (!cv || !c || !host) return;
    const pts = fibonacciSphere(items.length).map((p, i) => ({ ...p, t: items[i] }));
    const mesh = fibonacciSphere(90, 1);
    let W = 0, H = 0, ry = 0, rx = -0.2, mx = -1, my = -1, frame = 0, lastHot: string | null = null;
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = host.clientWidth; H = host.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const move = (e: PointerEvent) => { const r = host.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; };
    const leave = () => { mx = -1; };
    const rot = (p: { x: number; y: number; z: number }) => {
      const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
      const x = p.x * cy - p.z * sy;
      let z = p.x * sy + p.z * cy;
      const y = p.y * cx - z * sx;
      z = p.y * sx + z * cx;
      return { x, y, z };
    };
    const loop = () => {
      frame = requestAnimationFrame(loop);
      const s = spin.current;
      if (s) {
        ry += s.vx; rx = Math.max(-0.6, Math.min(0.6, rx + s.vy));
        if (!s.dragging) { s.vx += (0.0035 - s.vx) * 0.03; s.vy *= 0.92; }
      }
      c.clearRect(0, 0, W, H);
      const R = Math.min(W, H) * 0.36, ox = W / 2, oy = H / 2, f = 4;
      const proj = (q: { x: number; y: number; z: number }) => { const k = f / (f - q.z); return { x: ox + q.x * R * k, y: oy - q.y * R * k, k }; };
      for (const p of mesh) {
        const q = rot({ x: p.x * 0.6, y: p.y * 0.6, z: p.z * 0.6 }), pr = proj(q);
        c.fillStyle = q.z > 0 ? "rgba(201,242,140,.9)" : "rgba(176,161,249,.35)";
        c.beginPath(); c.arc(pr.x, pr.y, 1.6 * pr.k, 0, 7); c.fill();
      }
      const list = pts.map((p) => { const q = rot(p); return { p, q, ...proj(q) }; }).sort((a, b) => a.q.z - b.q.z);
      let hot: (typeof list)[number] | null = null;
      for (const it of list) if (it.q.z > -0.2 && Math.abs(mx - it.x) < 60 && Math.abs(my - it.y) < 18) hot = it;
      const hotName = hot ? hot.p.t : null;
      if (hotName && hotName !== lastHot) { lastHot = hotName; hoverRef.current(hotName); }
      for (const it of list) {
        const d = (it.q.z + 1) / 2, isHot = it === hot, fs = (13 + 5 * d) * (isHot ? 1.2 : 1);
        c.font = `700 ${fs}px "Bricolage Grotesque Variable", system-ui, sans-serif`;
        const w = c.measureText(it.p.t).width + fs * 1.4, h = fs * 1.9;
        c.globalAlpha = 0.25 + d * 0.75;
        c.beginPath(); c.roundRect(it.x - w / 2, it.y - h / 2, w, h, h / 2);
        c.fillStyle = isHot ? "#C9F28C" : "rgba(19,34,23,.85)"; c.fill();
        if (!isHot) { c.strokeStyle = "rgba(241,243,234,.35)"; c.lineWidth = 1.2; c.stroke(); }
        c.fillStyle = isHot ? "#0F1C12" : "#F1F3EA";
        c.textAlign = "center"; c.textBaseline = "middle";
        c.fillText(it.p.t, it.x, it.y + 1);
        c.globalAlpha = 1;
      }
    };
    size();
    addEventListener("resize", size);
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    frame = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(frame); removeEventListener("resize", size); host.removeEventListener("pointermove", move); host.removeEventListener("pointerleave", leave); };
  }, [items, spin]);

  return <canvas ref={ref} style={{ width: "100%", height: "100%" }} />;
}
