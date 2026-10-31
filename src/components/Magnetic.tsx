"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";

/** Pulls its child toward the cursor while hovered, then springs back. */
export function Magnetic({ children, strength = 0.3, className }: { children: React.ReactNode; strength?: number; className?: string }) {
  const mx = useMotionValue(0), my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 220, damping: 15, mass: 0.5 });
  const y = useSpring(my, { stiffness: 220, damping: 15, mass: 0.5 });
  return (
    <motion.div
      className={className}
      style={{ x, y, display: "inline-flex" }}
      onPointerMove={(e) => {
        if (!hasFinePointer() || prefersReducedMotion()) return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left - r.width / 2) * strength);
        my.set((e.clientY - r.top - r.height / 2) * strength);
      }}
      onPointerLeave={() => { mx.set(0); my.set(0); }}
    >
      {children}
    </motion.div>
  );
}
