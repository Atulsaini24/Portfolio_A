"use client";

import { useEffect, useRef, useState } from "react";
import { storage } from "@/lib/motion";

const BEST_KEY = "raven-best";
type State = "ready" | "play" | "over";

export function FlappyRaven() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [overlay, setOverlay] = useState<{ title: string; text: string } | null>({ title: "Flappy Raven", text: "Tap or press space to start" });

  useEffect(() => {
    const cv = canvasRef.current, wrap = wrapRef.current, ctx = cv?.getContext("2d");
    if (!cv || !wrap || !ctx) return;
    const raven = new Image();
    raven.src = "/assets/raven.png";

    let W = 0, H = 0, state: State = "ready", spawn = 0, last = 0, shake = 0, frame = 0, inView = false;
    let current = 0, bestScore = Number(storage()?.getItem(BEST_KEY)) || 0;
    let bird = { x: 0, y: 0, vy: 0, r: 20 };
    let pipes: { x: number; top: number; passed: boolean }[] = [];
    let puffs: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
    setBest(bestScore);

    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const reset = () => {
      bird = { x: W * 0.26, y: H * 0.45, vy: 0, r: 20 };
      pipes = []; puffs = []; spawn = 0.6; current = 0; setScore(0);
    };
    const flap = () => {
      if (state === "over") { reset(); state = "ready"; }
      if (state === "ready") { state = "play"; setOverlay(null); }
      bird.vy = -Math.max(420, H * 0.95);
      for (let i = 0; i < 6; i++) puffs.push({ x: bird.x - 14, y: bird.y + 6, vx: -60 - Math.random() * 80, vy: (Math.random() - 0.3) * 90, life: 1 });
    };
    const gameOver = () => {
      state = "over"; shake = 12;
      const isBest = current > bestScore;
      if (isBest) { bestScore = current; storage()?.setItem(BEST_KEY, String(bestScore)); setBest(bestScore); }
      setOverlay({ title: isBest ? `New best: ${current}` : `Score: ${current}`, text: "Tap or press space to try again" });
    };
    const pill = (x: number, y: number, w: number, h: number, r: number) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };

    const loop = (t: number) => {
      frame = requestAnimationFrame(loop);
      const dt = Math.min(0.033, (t - last) / 1000 || 0);
      last = t;
      if (!inView) return;
      const g = H * 2.6, speed = Math.max(190, W * 0.28), gap = Math.max(150, H * 0.36), pw = Math.max(64, W * 0.085);

      if (state === "play") {
        bird.vy += g * dt; bird.y += bird.vy * dt;
        spawn -= dt;
        if (spawn <= 0) { spawn = 1.45; pipes.push({ x: W + pw, top: 60 + Math.random() * (H - gap - 120), passed: false }); }
        for (const p of pipes) {
          p.x -= speed * dt;
          if (!p.passed && p.x + pw < bird.x) { p.passed = true; current++; setScore(current); }
        }
        pipes = pipes.filter((p) => p.x > -pw - 10);
        if (bird.y + bird.r > H || bird.y - bird.r < 0) gameOver();
        else for (const p of pipes) {
          if (bird.x + bird.r > p.x && bird.x - bird.r < p.x + pw && (bird.y - bird.r < p.top || bird.y + bird.r > p.top + gap)) { gameOver(); break; }
        }
      } else if (state === "ready") {
        bird.y = H * 0.45 + Math.sin(t / 300) * 10;
      }

      ctx.save();
      if (shake > 0) { ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake); shake *= 0.85; if (shake < 0.5) shake = 0; }
      ctx.fillStyle = "#D6F6A6"; ctx.fillRect(-20, -20, W + 40, H + 40);
      ctx.fillStyle = "rgba(30,52,34,.07)";
      ctx.font = `800 ${H * 0.55}px "Bricolage Grotesque Variable", system-ui, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(current), W / 2, H / 2);
      for (let i = 0; i < 4; i++) {
        const x = (((i * 300 - t * 0.02) % (W + 300)) + W + 300) % (W + 300) - 150;
        ctx.fillStyle = "rgba(176,161,249,.35)";
        ctx.beginPath(); ctx.arc(x, H * (0.2 + i * 0.19), 28 + i * 8, 0, 7); ctx.fill();
      }
      ctx.fillStyle = "#1E3422";
      for (const p of pipes) { pill(p.x, -pw, pw, p.top + pw, pw / 2); pill(p.x, p.top + gap, pw, H - p.top - gap + pw, pw / 2); }
      for (const p of puffs) {
        p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 2;
        ctx.fillStyle = `rgba(176,161,249,${Math.max(0, p.life)})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 6 * p.life + 2, 0, 7); ctx.fill();
      }
      puffs = puffs.filter((p) => p.life > 0);
      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.rotate(Math.max(-0.5, Math.min(1.1, bird.vy / 900)));
      const s = bird.r * 3.3;
      if (raven.complete) ctx.drawImage(raven, -s / 2, -s * 0.43, s, s * 0.86);
      ctx.restore();
      ctx.restore();
    };

    const onPointer = (e: PointerEvent) => { e.preventDefault(); flap(); };
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as Element | null;
      if ((e.code === "Space" || e.key === " ") && inView && !target?.closest("button,a,input,textarea")) { e.preventDefault(); flap(); }
    };
    const onResize = () => { size(); if (state !== "play") reset(); };
    const io = new IntersectionObserver(([e]) => (inView = e.intersectionRatio > 0.5), { threshold: [0, 0.5, 1] });

    size(); reset();
    cv.addEventListener("pointerdown", onPointer);
    addEventListener("keydown", onKey);
    addEventListener("resize", onResize);
    io.observe(wrap);
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      cv.removeEventListener("pointerdown", onPointer);
      removeEventListener("keydown", onKey);
      removeEventListener("resize", onResize);
      io.disconnect();
    };
  }, []);

  return (
    <section className="play" id="play">
      <div className="wrap">
        <div className="play-head">
          <h2 className="h2">Take a<br />break</h2>
          <p>Help the raven dodge the pillars. Tap, click or press space to flap. Your best score is saved on this device.</p>
        </div>
        <div className="game" ref={wrapRef}>
          <canvas ref={canvasRef} tabIndex={0} data-cursor-hover aria-label="Flappy Raven game. Press space or tap to flap." />
          <div className="hud" aria-live="polite">
            <span>Score <b>{score}</b></span>
            <span>Best <b>{best}</b></span>
          </div>
          <div className={`overlay${overlay ? "" : " off"}`}>
            <div><h3>{overlay?.title ?? "Flappy Raven"}</h3><p>{overlay?.text ?? ""}</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}
