"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { site } from "@/data/site";
import { useSite } from "@/lib/site-context";
import { EASE_OUT } from "@/lib/motion";
import { ScrambleText } from "../ScrambleText";
import { RollText } from "../RollText";
import { HeroName } from "./HeroName";
import { HeroScene } from "./HeroScene";

export function Hero() {
  const { introRun, navigate } = useSite();
  const ref = useRef<HTMLElement>(null);
  const started = introRun > 0;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -160]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: started ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 0.9, delay, ease: EASE_OUT },
  });

  return (
    <section className="hero" id="top" ref={ref}>
      <HeroScene assembled={started} progress={scrollYProgress} />
      <motion.div className="hero-copy wrap" style={{ y: copyY, opacity: copyOpacity }}>
        <HeroName name={site.name} run={introRun} />
        <div className="hero-meta">
          <motion.p className="role" {...rise(0.8)}>
            <ScrambleText text={site.intro} play={started} delay={0.85} duration={1.4} />
          </motion.p>
          <motion.a href="#contact" className="avail" onClick={(e) => { e.preventDefault(); navigate("contact"); }} {...rise(1.1)}>
            <i />
            <RollText>{site.availability}</RollText>
          </motion.a>
        </div>
      </motion.div>
      <motion.div className="scroll-cue" style={{ opacity: cueOpacity }}>
        <motion.button onClick={() => navigate("about")} aria-label="Scroll to About" {...rise(1.6)}>
          <span className="mouse"><i /></span>
          <span>Scroll</span>
        </motion.button>
      </motion.div>
    </section>
  );
}
