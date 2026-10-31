"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { capabilities, site } from "@/data/site";

function Word({ word, progress, range }: { word: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  return <motion.span className="w" style={{ opacity }}>{word} </motion.span>;
}

export function About() {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 55%"] });
  const words = site.statement.split(" ");

  return (
    <section className="about" id="about">
      <div className="wrap">
        <p className="statement" ref={ref} aria-label={site.statement}>
          {words.map((w, i) =>
            reduce ? (
              <span key={i} aria-hidden="true">{w} </span>
            ) : (
              <Word key={i} word={w} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />
            ),
          )}
        </p>
        <div className="caps">
          {capabilities.map((c) => (
            <div key={c.title}>
              <h3>{c.title}</h3>
              <p>{c.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
