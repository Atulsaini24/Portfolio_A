"use client";

import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, useVelocity } from "motion/react";
import { useRef } from "react";

const wrap = (min: number, max: number, v: number) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};

/** A text band that drifts on its own, speeds up with scroll velocity and leans into it. */
export function VelocityMarquee({ items, baseVelocity = 3, className }: { items: string[]; baseVelocity?: number; className?: string }) {
  const reduce = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { damping: 50, stiffness: 400 });
  const factor = useTransform(smooth, [0, 1000], [0, 4], { clamp: false });
  const skewX = useTransform(smooth, [-2500, 2500], [10, -10], { clamp: true });
  const x = useTransform(baseX, (v) => `${wrap(-25, 0, v)}%`);
  const dir = useRef(1);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    let move = dir.current * baseVelocity * (delta / 1000);
    const f = factor.get();
    if (f < 0) dir.current = -1 * Math.sign(baseVelocity || 1);
    else if (f > 0) dir.current = 1;
    move += dir.current * move * Math.abs(f);
    baseX.set(baseX.get() + move);
  });

  const row = (
    <span className="mq-row">
      {items.map((t) => (
        <span key={t} className="mq-item">
          {t}
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" /></svg>
        </span>
      ))}
    </span>
  );

  return (
    <div className={`marquee ${className ?? ""}`} aria-hidden="true">
      <motion.div className="mq-track" style={{ x, skewX }}>
        {row}{row}{row}{row}
      </motion.div>
    </div>
  );
}
