"use client";

import { useEffect, useRef, useState } from "react";
import { storage } from "@/lib/motion";
import { sound } from "@/lib/sound";
import { RevealText } from "../RevealText";

const BEST_KEY = "raven-best";
type State = "ready" | "play" | "over";
type Rgb = [number, number, number];
// Background shifts every 10 points: lime → lilac → bone.
const SKIES: Rgb[] = [[214, 246, 166], [221, 213, 253], [241, 243, 234]];

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
      {muted ? (
        <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function FlappyRaven() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [muted, setMuted] = useState(false);
  const [overlay, setOverlay] = useState<{ title: string; text: string } | null>({ title: "Flappy Raven", text: "Tap or press space to start" });

  useEffect(() => {
    setMuted(sound().muted);
    return sound().onMuteChange(setMuted);
  }, []);

  useEffect(() => {
    const cv = canvasRef.current, wrap = wrapRef.current, ctx = cv?.getContext("2d");
    if (!cv || !wrap || !ctx) return;
    const raven = new Image();
    raven.src = "/assets/raven.png";
    const sfx = sound();

    let W = 0, H = 0, state: State = "ready", spawn = 0, last = 0, shake = 0, flash = 0, squash = 0, frame = 0, inView = false;
    let current = 0, bestScore = Number(storage()?.getItem(BEST_KEY)) || 0;
    let sky: Rgb = [...SKIES[0]];
    let bird = { x: 0, y: 0, vy: 0, r: 20 };
    let pipes: { x: number; top: number; gap: number; passed: boolean }[] = [];
    let puffs: { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[] = [];
    let pops: { x: number; y: number; life: number; text: string }[] = [];
    setBest(bestScore);

    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const reset = () => {
      bird = { x: W * 0.26, y: H * 0.45, vy: 0, r: 20 };
      pipes = []; puffs = []; pops = []; spawn = 0.6; current = 0; setScore(0);
    };
    const burst = (x: number, y: number, n: number, colors: string[], power: number) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = power * (0.4 + Math.random());
        puffs.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - power * 0.3, life: 1, color: colors[i % colors.length], size: 3 + Math.random() * 4 });
      }
    };
    const flap = () => {
      sfx.unlock();
      if (state === "over") { reset(); state = "ready"; }
      if (state === "ready") { state = "play"; setOverlay(null); sfx.startMusic(); }
      bird.vy = -Math.max(420, H * 0.95);
      squash = 1;
      sfx.flap();
      for (let i = 0; i < 6; i++) puffs.push({ x: bird.x - 14, y: bird.y + 6, vx: -60 - Math.random() * 80, vy: (Math.random() - 0.3) * 90, life: 1, color: "176,161,249", size: 6 });
    };
    const gameOver = () => {
      state = "over"; shake = 14;
      sfx.hit();
      sfx.stopMusic();
      burst(bird.x, bird.y, 24, ["30,52,34", "176,161,249"], 260);
      const isBest = current > bestScore;
      if (isBest) {
        bestScore = current;
        storage()?.setItem(BEST_KEY, String(bestScore));
        setBest(bestScore);
        sfx.newBest();
        setTimeout(() => burst(W / 2, H * 0.35, 80, ["201,242,140", "176,161,249", "30,52,34", "241,243,234"], 420), 300);
      }
      setOverlay({ title: isBest ? `New best: ${current}` : `Score: ${current}`, text: "Tap or press space to try again" });
    };
    const pill = (x: number, y: number, w: number, h: number, r: number) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };

    const loop = (t: number) => {
      if (!inView) return;
      frame = requestAnimationFrame(loop);
      const dt = Math.min(0.033, (t - last) / 1000 || 0);
      last = t;
      const level = Math.min(current, 30);
      const g = H * 2.6;
      const speed = Math.max(190, W * 0.28) * (1 + level * 0.02);
      const gap = Math.max(140, H * 0.36) * (1 - level * 0.005);
      const pw = Math.max(64, W * 0.085);

      if (state === "play") {
        bird.vy += g * dt; bird.y += bird.vy * dt;
        spawn -= dt;
        if (spawn <= 0) { spawn = Math.max(1.05, 1.45 - level * 0.012); pipes.push({ x: W + pw, top: 60 + Math.random() * (H - gap - 120), gap, passed: false }); }
        for (const p of pipes) {
          p.x -= speed * dt;
          if (!p.passed && p.x + pw < bird.x) {
            p.passed = true; current++; setScore(current);
            pops.push({ x: bird.x + 24, y: bird.y - 20, life: 1, text: "+1" });
            if (current % 10 === 0) { flash = 1; sfx.milestone(); burst(bird.x, bird.y, 30, ["201,242,140", "176,161,249"], 300); }
            else sfx.score(current % 10);
          }
        }
        pipes = pipes.filter((p) => p.x > -pw - 10);
        if (bird.y + bird.r > H || bird.y - bird.r < 0) gameOver();
        else for (const p of pipes) {
          if (bird.x + bird.r > p.x && bird.x - bird.r < p.x + pw && (bird.y - bird.r < p.top || bird.y + bird.r > p.top + p.gap)) { gameOver(); break; }
        }
      } else if (state === "ready") {
        bird.y = H * 0.45 + Math.sin(t / 300) * 10;
      }

      // sky colour eases toward the current tier
      const tier = SKIES[Math.min(SKIES.length - 1, Math.floor(current / 10))];
      sky = sky.map((v, i) => v + (tier[i] - v) * 0.03) as Rgb;

      ctx.save();
      if (shake > 0) { ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake); shake *= 0.85; if (shake < 0.5) shake = 0; }
      ctx.fillStyle = `rgb(${sky.map(Math.round).join(",")})`;
      ctx.fillRect(-20, -20, W + 40, H + 40);

      // far parallax: soft hills
      ctx.fillStyle = "rgba(30,52,34,.06)";
      for (let i = 0; i < 6; i++) {
        const x = ((((i * 260 - t * 0.03) % (W + 260)) + W + 260) % (W + 260)) - 130;
        ctx.beginPath(); ctx.arc(x, H + 40, 160 + (i % 3) * 40, Math.PI, 0); ctx.fill();
      }
      // big score watermark
      ctx.fillStyle = "rgba(30,52,34,.07)";
      ctx.font = `800 ${H * 0.55}px "Bricolage Grotesque Variable", system-ui, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(current), W / 2, H / 2);
      // mid parallax: floating rings (from the loader's shapes)
      for (let i = 0; i < 4; i++) {
        const x = ((((i * 300 - t * 0.06) % (W + 300)) + W + 300) % (W + 300)) - 150;
        ctx.fillStyle = "rgba(176,161,249,.35)";
        ctx.beginPath(); ctx.arc(x, H * (0.2 + i * 0.19), 28 + i * 8, 0, 7); ctx.fill();
      }
      ctx.fillStyle = "#1E3422";
      for (const p of pipes) {
        pill(p.x, -pw, pw, p.top + pw, pw / 2);
        pill(p.x, p.top + p.gap, pw, H - p.top - p.gap + pw, pw / 2);
      }
      for (const p of puffs) {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; p.life -= dt * 1.6;
        ctx.fillStyle = `rgba(${p.color},${Math.max(0, p.life)})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * Math.max(0.2, p.life), 0, 7); ctx.fill();
      }
      puffs = puffs.filter((p) => p.life > 0);

      // the raven, squashing on each flap
      squash = Math.max(0, squash - dt * 5);
      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.rotate(Math.max(-0.5, Math.min(1.1, bird.vy / 900)));
      ctx.scale(1 + squash * 0.18, 1 - squash * 0.18);
      const s = bird.r * 3.3;
      if (raven.complete) ctx.drawImage(raven, -s / 2, -s * 0.43, s, s * 0.86);
      ctx.restore();

      for (const p of pops) {
        p.y -= 50 * dt; p.life -= dt * 1.4;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = "#1E3422";
        ctx.font = `800 22px "Bricolage Grotesque Variable", system-ui, sans-serif`;
        ctx.fillText(p.text, p.x, p.y);
      }
      ctx.globalAlpha = 1;
      pops = pops.filter((p) => p.life > 0);

      if (flash > 0) { ctx.fillStyle = `rgba(176,161,249,${flash * 0.5})`; ctx.fillRect(-20, -20, W + 40, H + 40); flash -= dt * 2; }
      ctx.restore();
    };

    const onPointer = (e: PointerEvent) => { e.preventDefault(); flap(); };
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as Element | null;
      if ((e.code === "Space" || e.key === " ") && inView && !target?.closest("button,a,input,textarea")) { e.preventDefault(); flap(); }
    };
    const onResize = () => { size(); if (state !== "play") reset(); };
    const io = new IntersectionObserver(([e]) => {
      const nowInView = e.intersectionRatio > 0.5;
      if (nowInView && !inView) {
        inView = true;
        last = performance.now();
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(loop);
        if (state === "play") sfx.startMusic();
      } else if (!nowInView && inView) {
        inView = false;
        cancelAnimationFrame(frame);
        if (state === "play") sfx.stopMusic();
      }
    }, { threshold: [0, 0.5, 1] });

    size(); reset();
    cv.addEventListener("pointerdown", onPointer);
    addEventListener("keydown", onKey);
    addEventListener("resize", onResize);
    io.observe(wrap);
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      sfx.stopMusic();
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
          <RevealText className="h2" lines={["Take a", "break"]} />
          <p>Help the raven dodge the pillars. Tap, click or press space to flap. It gets faster every point, and the sky changes every 10. Sound on for the soundtrack.</p>
        </div>
        <div className="game" ref={wrapRef}>
          <canvas ref={canvasRef} tabIndex={0} data-cursor="Flap" aria-label="Flappy Raven game. Press space or tap to flap." />
          <div className="hud">
            <span aria-live="polite">Score <b>{score}</b></span>
            <span className="hud-right">
              <span>Best <b>{best}</b></span>
              <button className="mute" onClick={() => { sound().unlock(); sound().setMuted(!muted); }} aria-label={muted ? "Turn sound on" : "Turn sound off"} aria-pressed={!muted}>
                <SpeakerIcon muted={muted} />
              </button>
            </span>
          </div>
          <div className={`overlay${overlay ? "" : " off"}`}>
            <div><h3>{overlay?.title ?? "Flappy Raven"}</h3><p>{overlay?.text ?? ""}</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}
