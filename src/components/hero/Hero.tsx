"use client";

import { motion } from "motion/react";
import { site } from "@/data/site";
import { useSite } from "@/lib/site-context";
import { EASE_OUT } from "@/lib/motion";
import { HeroName } from "./HeroName";
import { ParticlePortrait } from "./ParticlePortrait";
import { Signature } from "./Signature";

export function Hero() {
  const { introRun } = useSite();
  const started = introRun > 0;
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: started ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 0.9, delay, ease: EASE_OUT },
  });

  return (
    <section className="hero" id="top">
      <Signature className="sig" play={introRun || false} delay={0.4} />
      <ParticlePortrait assembled={started} />
      <motion.p className="hint" {...rise(1.3)}>Move through me · click to scatter</motion.p>
      <div className="hero-copy wrap">
        <HeroName name={site.name} run={introRun} />
        <div className="hero-meta">
          <motion.p className="role" {...rise(0.9)}>{site.intro}</motion.p>
          <motion.span className="avail" {...rise(1.02)}><i />{site.availability}</motion.span>
        </div>
      </div>
    </section>
  );
}
