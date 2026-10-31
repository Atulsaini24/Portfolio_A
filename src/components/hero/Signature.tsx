"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { SIGNATURE_PATH, SIGNATURE_VIEWBOX } from "@/data/signature";

type Props = {
  className?: string;
  /** Start drawing when this changes to a truthy value. Omit to draw when scrolled into view. */
  play?: number | boolean;
  delay?: number;
  duration?: number;
  /** Fill opacity reached after the stroke is drawn. */
  fill?: number;
};

/** "Atul Saini" written by hand: the stroke draws itself, then the ink settles in. */
export function Signature({ className, play, delay = 0, duration = 3.2, fill = 0.35 }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const go = play === undefined ? inView : !!play;
  return (
    <svg ref={ref} className={className} viewBox={SIGNATURE_VIEWBOX} aria-hidden="true" key={String(play)}>
      <motion.path
        d={SIGNATURE_PATH}
        initial={{ pathLength: 0, fillOpacity: 0 }}
        animate={go ? { pathLength: 1, fillOpacity: fill } : undefined}
        transition={{
          pathLength: { duration, delay, ease: [0.45, 0, 0.2, 1] },
          fillOpacity: { duration: 1.6, delay: delay + duration, ease: "easeOut" },
        }}
      />
    </svg>
  );
}
