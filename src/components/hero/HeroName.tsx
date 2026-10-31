"use client";

import { motion } from "motion/react";
import { useRef } from "react";
import { EASE_OUT } from "@/lib/motion";
import { useProximityType } from "@/lib/use-proximity-type";

/** The name, split into letters that rise in (with a slight 3D flip) on intro, then react to the cursor. */
export function HeroName({ name, run }: { name: string; run: number }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useProximityType(ref, ".l", { base: 300, max: 800, radius: 320, pull: 12 }, [run]);
  let index = 0;
  return (
    <h1 className="name" ref={ref}>
      <span className="sr">{name}</span>
      {name.split(" ").map((line) => (
        <span className="line" aria-hidden="true" key={`${line}-${run}`}>
          {[...line].map((ch) => {
            const i = index++;
            return (
              <motion.span
                className="l" key={i}
                initial={{ y: "110%", rotateX: -70, opacity: 0 }}
                animate={run > 0 ? { y: "0%", rotateX: 0, opacity: 1 } : undefined}
                transition={{ duration: 1.2, delay: 0.15 + i * 0.06, ease: EASE_OUT }}
              >
                {ch}
              </motion.span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}
