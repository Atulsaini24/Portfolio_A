"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * MeshRelay routing, simulated: phones only talk to neighbours in radio range, packets hop
 * along the shortest live route (BFS), and when no route exists the packet is held at the
 * current phone until one appears (store-and-forward, the core idea of delay-tolerant networking).
 */

type Node = { hx: number; hy: number; x: number; y: number; alive: boolean; phase: number };
type Packet = { at: number; next: number | null; t: number; hops: number; route: number[]; held: boolean; delivered: boolean; trail: number[] };

const SRC = 0, DST = 1;
// Home positions (0–1). Laid out so there are several alternative routes from A to B.
const LAYOUT: [number, number][] = [
  [0.07, 0.5], [0.93, 0.5],
  [0.22, 0.25], [0.24, 0.74], [0.38, 0.45], [0.42, 0.15], [0.5, 0.8],
  [0.58, 0.38], [0.66, 0.66], [0.72, 0.2], [0.8, 0.78], [0.84, 0.36],
];

const C = { lime: "#C9F28C", lilac: "#B0A1F9", bone: "#F1F3EA", dead: "rgba(241,243,234,.22)", ink: "#0F1C12" };

export default function MeshDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodes = useRef<Node[]>(LAYOUT.map(([x, y]) => ({ hx: x, hy: y, x, y, alive: true, phase: Math.random() * 6.28 })));
  const packet = useRef<Packet | null>(null);
  const api = useRef<{ send: () => void; knock: () => void; reset: () => void } | null>(null);
  const [status, setStatus] = useState("Sending a packet from A to B…");
  const [route, setRoute] = useState<string>("");

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = prefersReducedMotion();
    let W = 0, H = 0, frame = 0, last = performance.now(), visible = true, tick = 0;
    let drag: { i: number; sx: number; sy: number; moved: boolean } | null = null;
    let lastStatus = "", lastRoute = "";
    const bursts: { x: number; y: number; r: number; life: number }[] = [];

    const size = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const range = () => Math.max(96, Math.min(W * 0.25, 170));
    const px = (n: Node) => ({ x: n.x * W, y: n.y * H });
    const linked = (a: number, b: number) => {
      const A = nodes.current[a], B = nodes.current[b];
      if (!A.alive || !B.alive) return false;
      const p = px(A), q = px(B);
      return Math.hypot(p.x - q.x, p.y - q.y) <= range();
    };
    const bfs = (from: number): number[] | null => {
      const n = nodes.current.length, prev = new Array(n).fill(-1), seen = new Array(n).fill(false);
      const queue = [from]; seen[from] = true;
      while (queue.length) {
        const u = queue.shift()!;
        if (u === DST) break;
        for (let v = 0; v < n; v++) if (!seen[v] && linked(u, v)) { seen[v] = true; prev[v] = u; queue.push(v); }
      }
      if (!seen[DST]) return null;
      const path = [DST];
      while (path[0] !== from) path.unshift(prev[path[0]]);
      return path;
    };
    const label = (i: number) => (i === SRC ? "A" : i === DST ? "B" : String(i - 1));

    const send = () => {
      packet.current = { at: SRC, next: null, t: 0, hops: 0, route: [], held: false, delivered: false, trail: [SRC] };
    };
    const knock = () => {
      // Take out a relay on the current route, so you can watch the packet find another way.
      const p = packet.current;
      const onRoute = p?.route.filter((i) => i !== SRC && i !== DST && i !== p.at && i !== p.next && nodes.current[i].alive) ?? [];
      const pool = onRoute.length ? onRoute : nodes.current.map((n, i) => i).filter((i) => i > DST && nodes.current[i].alive);
      if (!pool.length) return;
      nodes.current[pool[Math.floor(Math.random() * pool.length)]].alive = false;
      if (!p || p.delivered) send();
    };
    const reset = () => {
      nodes.current.forEach((n, i) => { n.alive = true; n.hx = n.x = LAYOUT[i][0]; n.hy = n.y = LAYOUT[i][1]; });
      send();
    };
    api.current = { send, knock, reset };

    const step = (now: number) => {
      frame = requestAnimationFrame(step);
      if (!visible) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now; tick += dt;
      const R = range();

      // gentle drift, like people carrying phones around
      for (const n of nodes.current) {
        if (drag && nodes.current[drag.i] === n) continue;
        const a = reduce ? 0 : 0.012;
        n.x = n.hx + Math.sin(tick * 0.6 + n.phase) * a;
        n.y = n.hy + Math.cos(tick * 0.5 + n.phase * 1.3) * a * 1.6;
      }

      // packet logic
      const p = packet.current;
      if (p && !p.delivered) {
        if (p.next === null) {
          const path = bfs(p.at);
          p.route = path ?? [];
          if (path && path.length > 1) { p.next = path[1]; p.t = 0; p.held = false; }
          else p.held = true;
        } else {
          p.t += dt / (reduce ? 0.25 : 0.6);
          if (p.t >= 1) {
            p.at = p.next; p.next = null; p.hops++; p.trail.push(p.at);
            if (p.at === DST) {
              p.delivered = true;
              const b = px(nodes.current[DST]);
              bursts.push({ x: b.x, y: b.y, r: 10, life: 1 });
            }
          }
        }
      }

      // status for screen readers and the caption
      let s = "";
      if (!p) s = "Press “Send a packet” to start.";
      else if (p.delivered) s = `Delivered to B in ${p.hops} hop${p.hops === 1 ? "" : "s"}, with no internet involved.`;
      else if (p.held) s = `No route from ${label(p.at)} right now. Holding the packet until one appears. Drag a phone closer to help.`;
      else s = `Hop ${p.hops + 1}: relaying through ${label(p.next ?? p.at)}.`;
      const r = p ? (p.delivered ? p.trail : [...p.trail.slice(0, -1), ...(p.route.length ? p.route : [p.at])]).map(label).join(" → ") : "";
      if (s !== lastStatus) { lastStatus = s; setStatus(s); }
      if (r !== lastRoute) { lastRoute = r; setRoute(r); }

      // draw
      ctx.clearRect(0, 0, W, H);
      const ns = nodes.current;
      const routeSet = new Set<string>();
      if (p && !p.delivered) for (let i = 0; i + 1 < p.route.length; i++) routeSet.add(`${Math.min(p.route[i], p.route[i + 1])}-${Math.max(p.route[i], p.route[i + 1])}`);
      for (let i = 0; i < ns.length; i++) for (let j = i + 1; j < ns.length; j++) {
        if (!linked(i, j)) continue;
        const a = px(ns[i]), b = px(ns[j]);
        const onRoute = routeSet.has(`${i}-${j}`);
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        ctx.strokeStyle = onRoute ? C.lime : `rgba(176,161,249,${0.55 - (d / R) * 0.35})`;
        ctx.lineWidth = onRoute ? 2.5 : 1.2;
        ctx.setLineDash(onRoute ? [] : [4, 5]);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      ctx.setLineDash([]);

      ns.forEach((n, i) => {
        const { x, y } = px(n);
        const end = i === SRC || i === DST;
        const r = end ? 15 : 10;
        if (!n.alive) {
          ctx.strokeStyle = C.dead; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5); ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5); ctx.stroke();
          return;
        }
        ctx.fillStyle = i === SRC ? C.lime : i === DST ? C.lilac : "#2A4A30";
        ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
        if (!end) { ctx.strokeStyle = "rgba(241,243,234,.5)"; ctx.lineWidth = 1.2; ctx.stroke(); }
        ctx.fillStyle = end ? C.ink : C.bone;
        ctx.font = `700 ${end ? 13 : 10}px "Bricolage Grotesque Variable", system-ui, sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(label(i), x, y + 0.5);
      });

      if (p) {
        const a = px(ns[p.at]);
        let x = a.x, y = a.y;
        if (p.next !== null) {
          const b = px(ns[p.next]);
          const u = p.t < 0.5 ? 2 * p.t * p.t : 1 - (-2 * p.t + 2) ** 2 / 2;
          x = a.x + (b.x - a.x) * u; y = a.y + (b.y - a.y) * u;
        }
        if (p.held) {
          const pulse = (tick * 1.4) % 1;
          ctx.strokeStyle = `rgba(201,242,140,${1 - pulse})`; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(x, y, 14 + pulse * 26, 0, 7); ctx.stroke();
        }
        if (!p.delivered) {
          const g = ctx.createRadialGradient(x, y, 0, x, y, 16);
          g.addColorStop(0, "#fff"); g.addColorStop(0.35, C.lime); g.addColorStop(1, "rgba(201,242,140,0)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 16, 0, 7); ctx.fill();
        }
      }
      for (const b of bursts) {
        b.r += 60 * dt * 3; b.life -= dt * 1.4;
        ctx.strokeStyle = `rgba(201,242,140,${Math.max(0, b.life)})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.stroke();
      }
      while (bursts.length && bursts[0].life <= 0) bursts.shift();
    };

    const hit = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      let best = -1, bd = 22;
      nodes.current.forEach((n, i) => { const d = Math.hypot(n.x * W - x, n.y * H - y); if (d < bd) { bd = d; best = i; } });
      return { i: best, x, y };
    };
    const down = (e: PointerEvent) => {
      const h = hit(e);
      if (h.i < 0) return;
      drag = { i: h.i, sx: h.x, sy: h.y, moved: false };
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (!drag) { canvas.style.cursor = hit(e).i >= 0 ? "grab" : ""; return; }
      if (Math.hypot(x - drag.sx, y - drag.sy) > 4) drag.moved = true;
      const n = nodes.current[drag.i];
      n.hx = n.x = Math.max(0.03, Math.min(0.97, x / W));
      n.hy = n.y = Math.max(0.06, Math.min(0.94, y / H));
    };
    const up = () => {
      if (drag && !drag.moved && drag.i > DST && drag.i !== packet.current?.next && drag.i !== packet.current?.at) {
        // A tap toggles a relay phone on or off.
        const n = nodes.current[drag.i];
        n.alive = !n.alive;
        const p = packet.current;
        if (p?.delivered) send();
      }
      drag = null;
    };

    size();
    send();
    const ro = new ResizeObserver(size); ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; last = performance.now(); }); io.observe(canvas);
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame); ro.disconnect(); io.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    };
  }, []);

  return (
    <div className="demo demo-mesh">
      <canvas
        ref={canvasRef}
        className="mesh-canvas"
        role="img"
        aria-label="A mesh of phones. A packet travels from phone A to phone B by hopping between phones in radio range."
      />
      <p className="demo-status" aria-live="polite">{status}</p>
      {route && <p className="demo-route">Route: {route}</p>}
      <div className="demo-controls">
        <button className="d-btn primary" onClick={() => api.current?.knock()}>Knock out a phone</button>
        <button className="d-btn" onClick={() => api.current?.send()}>Send another packet</button>
        <button className="d-btn" onClick={() => api.current?.reset()}>Reset</button>
      </div>
      <p className="demo-hint">Tap a phone to switch it off, or drag it out of range. The dashed lines are radio links.</p>
    </div>
  );
}
