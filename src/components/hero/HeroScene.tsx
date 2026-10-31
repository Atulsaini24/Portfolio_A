"use client";

import type { MotionValue } from "motion/react";
import { useEffect, useRef } from "react";
import { SIGNATURE_PATH } from "@/data/signature";
import { prefersReducedMotion } from "@/lib/motion";

/* ---------------------------------------------------------------------------------------------
 * The hero is one canvas drawn in two layers:
 *   back layer  – star field, cursor glow, rim light and the signature written by a shooting star.
 *                 The portrait silhouette is cut out of this layer, so all of it sits BEHIND Atul.
 *   front layer – the particle portrait, click shockwaves and cursor sparkles.
 * ------------------------------------------------------------------------------------------- */

type Particle = {
  hx: number; hy: number; x: number; y: number; vx: number; vy: number;
  size: number; k: number; delay: number; phase: number; dx: number; dy: number; dist: number;
};
type Star = { x: number; y: number; r: number; depth: number; phase: number; lime: boolean };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; size: number; color: string };
type Ring = { x: number; y: number; r: number; life: number };

type Rgb = [number, number, number];
const DEEP: Rgb = [110, 95, 214], LILAC: Rgb = [176, 161, 249], BONE: Rgb = [241, 243, 234], LIME: Rgb = [201, 242, 140];
const mix = (a: Rgb, b: Rgb, t: number): Rgb => a.map((v, i) => Math.round(v + (b[i] - v) * t)) as Rgb;
const toneFor = (l: number): Rgb =>
  l < 0.45 ? mix(DEEP, LILAC, l / 0.45) : l < 0.78 ? mix(LILAC, BONE, (l - 0.45) / 0.33) : mix(BONE, LIME, (l - 0.78) / 0.22);

const easeInOut = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

// Signature path space (matches SIGNATURE_VIEWBOX "-130 150 3870 820").
const SIG = { x0: -130, x1: 3740, cx: 1805, cy: 560, w: 3870 };
const STAR_ENTER = 0.55, STAR_WRITE = 2.4, STAR_EXIT = 0.6;

/** Point on the shooting star's flight path at time t (seconds since launch), in signature space. */
function starAt(t: number): { x: number; y: number; phase: "enter" | "write" | "exit" | "done" } {
  if (t < STAR_ENTER) {
    const u = easeInOut(t / STAR_ENTER);
    return { x: -1500 + (SIG.x0 + 1500) * u, y: -700 + (640 + 700) * u, phase: "enter" };
  }
  t -= STAR_ENTER;
  if (t < STAR_WRITE) {
    const u = easeInOut(t / STAR_WRITE);
    return { x: SIG.x0 + (SIG.x1 - SIG.x0) * u, y: 640 - Math.sin(Math.PI * u) * 150 + Math.sin(u * 18) * 60, phase: "write" };
  }
  t -= STAR_WRITE;
  if (t < STAR_EXIT) {
    const u = (t / STAR_EXIT) ** 2;
    return { x: SIG.x1 + 1400 * u, y: 600 - 900 * u, phase: "exit" };
  }
  return { x: SIG.x1 + 1400, y: -300, phase: "done" };
}

export function HeroScene({ assembled, progress }: { assembled: boolean; progress: MotionValue<number> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const assembledAt = useRef<number | null>(null);

  useEffect(() => {
    assembledAt.current = assembled ? performance.now() : null;
  }, [assembled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;

    const reduce = prefersReducedMotion();
    const back = document.createElement("canvas");
    const bctx = back.getContext("2d")!;
    const sigPath = new Path2D(SIGNATURE_PATH);
    const img = new Image();
    img.src = "/assets/portrait-particles.png";

    let W = 0, H = 0, dpr = 1, alive = true, visible = true, frame = 0, tick = 0;
    let particles: Particle[] = [], buckets: [string, Particle[]][] = [], stars: Star[] = [];
    let sparks: Spark[] = [], trail: { x: number; y: number }[] = [], rings: Ring[] = [];
    let box = { ox: 0, oy: 0, pw: 0, ph: 0 };
    let sigM = new DOMMatrix();
    const pointer = { x: -9999, y: -9999, sx: 0, sy: 0, nx: 0, ny: 0, active: false };
    let overFace = false, lastSparkAt = 0, sub = 1;

    const layout = () => {
      const wrap = host.querySelector(".wrap")?.getBoundingClientRect();
      const left = wrap ? wrap.left - host.getBoundingClientRect().left : 24;
      const right = wrap ? left + wrap.width : W - 24;
      const ar = img.naturalWidth / img.naturalHeight || 0.755;
      const landscape = W / H >= 1.05 && W >= 900;
      if (landscape) {
        const ph = Math.min(H * 0.95, 1020), pw = ph * ar;
        box = { ph, pw, ox: Math.min(right - pw * 0.95, W - pw), oy: H - ph };
        const sigW = Math.min(W * 0.8, pw * 2.4);
        const cx = box.ox + pw * 0.5 - sigW * 0.18, cy = box.oy + ph * 0.25;
        sigM = new DOMMatrix().translate(cx, cy).rotate(-7).scale(sigW / SIG.w).translate(-SIG.cx, -SIG.cy);
      } else {
        const ph = Math.min(H * 0.58, (W * 0.92) / ar), pw = ph * ar;
        box = { ph, pw, ox: (W - pw) / 2, oy: Math.max(64, H * 0.08) };
        const sigW = W * 1.02;
        sigM = new DOMMatrix().translate(W / 2, box.oy + ph * 0.24).rotate(-7).scale(sigW / SIG.w).translate(-SIG.cx, -SIG.cy);
      }
    };

    const build = () => {
      const rect = host.getBoundingClientRect();
      W = rect.width; H = rect.height;
      dpr = Math.min(devicePixelRatio || 1, 2);
      for (const c of [canvas, back]) { c.width = W * dpr; c.height = H * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      stars = Array.from({ length: Math.round((W * H) / 9000) }, () => ({
        x: Math.random() * W, y: Math.random() * H * 0.9, r: 0.5 + Math.random() * 1.3,
        depth: 0.2 + Math.random() * 0.8, phase: Math.random() * 6.28, lime: Math.random() < 0.12,
      }));
      if (!img.complete || !img.naturalWidth) return;
      layout();

      const { ox, oy, pw, ph } = box;
      const gap = W > 1600 ? 5 : 4;
      const sw = Math.round(pw / gap), sh = Math.round(ph / gap);
      const off = document.createElement("canvas");
      off.width = sw; off.height = sh;
      const o = off.getContext("2d", { willReadFrequently: true })!;
      o.drawImage(img, 0, 0, sw, sh);
      const data = o.getImageData(0, 0, sw, sh).data;

      const prev = particles, next: Particle[] = [], groups = new Map<string, Particle[]>();
      for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
        const i = (y * sw + x) * 4;
        if (data[i + 3] < 10) continue;
        const lum = data[i] / 255, alpha = data[i + 3] / 255;
        const key = toneFor(lum).map((v) => Math.round(v / 20) * 20).join(",");
        const old = prev[next.length];
        const hy = oy + y * gap;
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        const p: Particle = {
          hx: ox + x * gap, hy,
          x: old ? old.x : Math.random() * W, y: old ? old.y : Math.random() * H,
          vx: 0, vy: 0, size: gap * (0.22 + lum * 0.7) * Math.pow(alpha, 0.9),
          k: 0.018 + Math.random() * 0.03,
          delay: old ? 0 : Math.random() * 60 + ((hy - oy) / ph) * 50,
          phase: Math.random() * 6.28, dx: Math.cos(ang), dy: Math.sin(ang), dist: 150 + Math.random() * 650,
        };
        if (reduce) { p.x = p.hx; p.y = p.hy; p.delay = 0; }
        next.push(p);
        const g = groups.get(key);
        if (g) g.push(p); else groups.set(key, [p]);
      }
      particles = next;
      buckets = [...groups.entries()].map(([c, arr]) => [`rgb(${c})`, arr]);
    };

    const toScreen = (x: number, y: number) => {
      const p = sigM.transformPoint(new DOMPoint(x, y));
      return { x: p.x, y: p.y };
    };

    const drawBack = (now: number, scroll: number) => {
      const b = bctx;
      b.clearRect(0, 0, W, H);
      const fade = 1 - scroll;
      if (fade <= 0) return;
      const since = assembledAt.current === null ? -1 : (now - assembledAt.current) / 1000;
      const { ox, oy, pw, ph } = box;

      // rim light behind the head + soft glow that follows the cursor
      const headX = ox + pw * 0.5, headY = oy + ph * 0.3;
      let g = b.createRadialGradient(headX, headY, 0, headX, headY, pw * 0.85);
      g.addColorStop(0, `rgba(201,242,140,${0.16 * fade})`);
      g.addColorStop(1, "rgba(201,242,140,0)");
      b.fillStyle = g; b.fillRect(0, 0, W, H);
      if (pointer.active) {
        g = b.createRadialGradient(pointer.sx, pointer.sy, 0, pointer.sx, pointer.sy, 420);
        g.addColorStop(0, `rgba(176,161,249,${0.16 * fade})`);
        g.addColorStop(1, "rgba(176,161,249,0)");
        b.fillStyle = g; b.fillRect(0, 0, W, H);
      }

      // stars, with depth parallax
      for (const s of stars) {
        const tw = reduce ? 0.7 : 0.45 + Math.sin(tick * 0.03 + s.phase) * 0.35;
        b.globalAlpha = tw * s.depth * fade;
        b.fillStyle = s.lime ? "#C9F28C" : "#F1F3EA";
        b.fillRect(s.x - pointer.nx * 26 * s.depth, s.y - pointer.ny * 18 * s.depth - scroll * 200 * s.depth, s.r, s.r);
      }
      b.globalAlpha = 1;

      // the signature, written left-to-right by the shooting star
      if (since >= 0 || reduce) {
        const t = reduce ? 99 : since - 1.5;
        const star = starAt(Math.max(0, t));
        const revealX = t < 0 ? SIG.x0 - 10 : star.phase === "enter" ? SIG.x0 - 10 : star.phase === "write" ? star.x : SIG.x1 + 50;
        b.save();
        b.translate(-pointer.nx * 14, -pointer.ny * 10);
        b.transform(sigM.a, sigM.b, sigM.c, sigM.d, sigM.e, sigM.f);
        b.beginPath();
        b.rect(SIG.x0 - 200, -2000, revealX - SIG.x0 + 200, 5000);
        b.clip();
        b.lineWidth = 2.2 / sigM.a;
        b.lineJoin = "round";
        b.strokeStyle = `rgba(176,161,249,${0.75 * fade})`;
        b.fillStyle = `rgba(176,161,249,${0.2 * fade})`;
        b.fill(sigPath); b.stroke(sigPath);
        b.restore();

        // a glint that sweeps along the signature every 9 seconds once it's written
        const total = STAR_ENTER + STAR_WRITE + STAR_EXIT;
        if (!reduce && t > total + 1) {
          const cycle = ((t - total - 1) % 9) / 1.6;
          if (cycle < 1) {
            const gx = SIG.x0 + (SIG.x1 - SIG.x0 + 600) * cycle - 300;
            b.save();
            b.translate(-pointer.nx * 14, -pointer.ny * 10);
            b.transform(sigM.a, sigM.b, sigM.c, sigM.d, sigM.e, sigM.f);
            b.beginPath(); b.rect(gx - 160, -2000, 320, 5000); b.clip();
            b.lineWidth = 3 / sigM.a;
            b.strokeStyle = `rgba(201,242,140,${0.9 * fade})`;
            b.stroke(sigPath);
            b.restore();
          }
        }

        // the star itself: glowing head, tapering tail and sparks
        if (!reduce && t >= 0 && star.phase !== "done") {
          const head = toScreen(star.x, star.y);
          head.x -= pointer.nx * 14; head.y -= pointer.ny * 10;
          trail.push(head);
          if (trail.length > 26) trail.shift();
          const n = star.phase === "write" ? 2 : 1;
          for (let i = 0; i < n; i++) {
            sparks.push({
              x: head.x, y: head.y, vx: (Math.random() - 0.5) * 1.6, vy: Math.random() * 1.2 - 0.2,
              life: 1, size: 1 + Math.random() * 2.2,
              color: Math.random() < 0.5 ? "201,242,140" : Math.random() < 0.5 ? "176,161,249" : "241,243,234",
            });
          }
        } else if (trail.length) {
          trail.shift();
        }
        if (trail.length > 1) {
          b.lineCap = "round";
          for (let i = 1; i < trail.length; i++) {
            const u = i / trail.length;
            b.strokeStyle = `rgba(201,242,140,${u * 0.85 * fade})`;
            b.lineWidth = u * 6;
            b.beginPath(); b.moveTo(trail[i - 1].x, trail[i - 1].y); b.lineTo(trail[i].x, trail[i].y); b.stroke();
          }
          const h = trail[trail.length - 1];
          const hg = b.createRadialGradient(h.x, h.y, 0, h.x, h.y, 30);
          hg.addColorStop(0, `rgba(255,255,255,${fade})`);
          hg.addColorStop(0.25, `rgba(201,242,140,${0.85 * fade})`);
          hg.addColorStop(1, "rgba(201,242,140,0)");
          b.fillStyle = hg; b.beginPath(); b.arc(h.x, h.y, 30, 0, 7); b.fill();
        }
        for (const s of sparks) {
          s.x += s.vx * sub; s.y += s.vy * sub; s.vy += 0.03 * sub; s.life -= 0.018 * sub;
          b.fillStyle = `rgba(${s.color},${Math.max(0, s.life) * fade})`;
          b.fillRect(s.x, s.y, s.size * s.life, s.size * s.life);
        }
        sparks = sparks.filter((s) => s.life > 0);
      }

      // cut Atul's silhouette out of everything on this layer, so it all sits behind him
      if (img.complete && since >= 0) {
        const knock = clamp01((since - 0.3) / 2.2) * (1 - clamp01(scroll * 2.2));
        if (knock > 0) {
          b.save();
          b.globalCompositeOperation = "destination-out";
          b.globalAlpha = knock;
          b.drawImage(img, ox - pointer.nx * -10, oy - pointer.ny * -8, pw, ph);
          b.restore();
        }
      }
    };

    let lastNow = 0;
    const step = (now: number) => {
      if (!alive) return;
      frame = requestAnimationFrame(step);
      if (!visible) { lastNow = now; return; }
      // Physics is tuned for 60fps; run extra sub-steps on slow frames so it looks the same everywhere.
      const substeps = Math.max(1, Math.min(4, Math.round((now - (lastNow || now - 16.7)) / 16.7)));
      lastNow = now;
      tick += substeps;
      sub = substeps;
      const scroll = clamp01(progress.get());
      pointer.sx += (pointer.x - pointer.sx) * 0.12;
      pointer.sy += (pointer.y - pointer.sy) * 0.12;
      const tnx = pointer.active ? (pointer.x / W - 0.5) * 2 : 0, tny = pointer.active ? (pointer.y / H - 0.5) * 2 : 0;
      pointer.nx += (tnx - pointer.nx) * 0.05;
      pointer.ny += (tny - pointer.ny) * 0.05;

      drawBack(now, scroll);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(back, 0, 0, W, H);

      // particles (with mouse parallax and scroll dispersal)
      const parX = pointer.nx * 10, parY = pointer.ny * 8;
      const together = assembledAt.current !== null || reduce;
      const R = W < 760 ? 70 : 120, R2 = R * R;
      const spread = scroll * scroll;
      const px = pointer.x - parX, py = pointer.y - parY;
      for (const p of particles) {
        if (!together) {
          p.x += Math.sin(tick * 0.01 + p.phase) * 0.3 * substeps;
          p.y += Math.cos(tick * 0.012 + p.phase) * 0.3 * substeps;
          continue;
        }
        if (p.delay > 0) { p.delay -= substeps; continue; }
        const tx = p.hx + p.dx * p.dist * spread, ty = p.hy + p.dy * p.dist * spread;
        for (let s = 0; s < substeps; s++) {
          let ax = (tx - p.x) * p.k, ay = (ty - p.y) * p.k;
          if (pointer.active) {
            const dx = p.x - px, dy = p.y - py, dd = dx * dx + dy * dy;
            if (dd < R2) { const f = (1 - dd / R2) * 6, dl = Math.sqrt(dd) || 1; ax += (dx / dl) * f; ay += (dy / dl) * f; }
          }
          p.vx = (p.vx + ax) * 0.82; p.vy = (p.vy + ay) * 0.82;
          p.x += p.vx; p.y += p.vy;
        }
      }
      ctx.save();
      ctx.translate(parX, parY);
      ctx.globalAlpha = 1 - scroll * 0.85;
      for (const [color, arr] of buckets) {
        ctx.fillStyle = color;
        for (const p of arr) {
          const s = reduce ? p.size : p.size * (1 + Math.sin(tick * 0.04 + p.phase) * 0.12);
          ctx.fillRect(p.x, p.y, s, s);
        }
      }
      ctx.restore();

      // click shockwaves
      for (const r of rings) {
        r.r += (260 - r.r) * 0.08 * sub; r.life -= 0.025 * sub;
        ctx.strokeStyle = `rgba(201,242,140,${Math.max(0, r.life)})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 7); ctx.stroke();
      }
      rings = rings.filter((r) => r.life > 0);
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
      if (!pointer.active) { pointer.sx = pointer.x; pointer.sy = pointer.y; }
      pointer.active = true;
      const inFace = pointer.x > box.ox && pointer.x < box.ox + box.pw && pointer.y > box.oy && pointer.y < box.oy + box.ph * 0.72;
      if (inFace !== overFace) {
        overFace = inFace;
        window.dispatchEvent(new CustomEvent("cursorlabel", { detail: inFace ? "Click" : null }));
      }
      const now = performance.now();
      if (!reduce && now - lastSparkAt > 30) {
        lastSparkAt = now;
        sparks.push({ x: pointer.x, y: pointer.y, vx: (Math.random() - 0.5) * 1.2, vy: -Math.random() * 0.8, life: 0.9, size: 1.5 + Math.random() * 2, color: Math.random() < 0.6 ? "201,242,140" : "176,161,249" });
      }
    };
    const onLeave = () => {
      pointer.active = false;
      if (overFace) { overFace = false; window.dispatchEvent(new CustomEvent("cursorlabel", { detail: null })); }
    };
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element).closest("a,button") || reduce) return;
      const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      rings.push({ x, y, r: 0, life: 1 });
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
  }, [progress]);

  return (
    <canvas
      ref={canvasRef}
      className="particles"
      role="img"
      aria-label="Portrait of Atul Saini made of particles, with his signature written behind him by a shooting star. Move your cursor through it, or click to scatter it."
    />
  );
}
