"use client";

import { motion } from "motion/react";
import { EASE_OUT } from "@/lib/motion";

/** Heading whose lines slide up from behind a mask (with a slight tilt) when scrolled into view. */
export function RevealText({ lines, as: Tag = "h2", className, delay = 0 }: { lines: string[]; as?: "h2" | "h3" | "p"; className?: string; delay?: number }) {
  const MotionTag = motion[Tag];
  return (
    <MotionTag className={className} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.5 }} aria-label={lines.join(" ")}>
      {lines.map((line, i) => (
        <span className="reveal-line" key={i} aria-hidden="true">
          <motion.span
            variants={{ hidden: { y: "110%", rotate: 4 }, show: { y: "0%", rotate: 0 } }}
            transition={{ duration: 1, delay: delay + i * 0.1, ease: EASE_OUT }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}
