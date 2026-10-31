"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { capabilities, facts, site } from "@/data/site";
import { EASE_OUT } from "@/lib/motion";
import { RavenStage } from "../raven/RavenStage";

function Word({ word, progress, range }: { word: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.16, 1]);
  const y = useTransform(progress, range, [6, 0]);
  return <><motion.span className="w" style={{ opacity, y }}>{word}</motion.span>{" "}</>;
}

function Capability({ title, detail, index }: { title: string; detail: string; index: number }) {
  return (
    <motion.div
      className="cap"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.8, delay: index * 0.08, ease: EASE_OUT }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      <h3>{title}</h3>
      <p>{detail}</p>
    </motion.div>
  );
}

export function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 55%"] });
  const { scrollYProgress: sectionProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const words = site.statement.split(" ");

  return (
    <section className="about" id="about" ref={sectionRef}>
      <div className="wrap about-grid">
        <p className="statement" ref={ref} aria-label={site.statement}>
          {words.map((w, i) =>
            reduce ? (
              <span key={i} aria-hidden="true">{w} </span>
            ) : (
              <Word key={i} word={w} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />
            ),
          )}
        </p>
        <RavenStage scroll={sectionProgress} />
      </div>
      {facts.some((f) => f.value.trim()) && (
        <dl className="wrap facts">
          {facts.filter((f) => f.value.trim()).map((f) => (
            <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>
          ))}
        </dl>
      )}
      <div className="wrap caps">
        {capabilities.map((c, i) => <Capability key={c.title} {...c} index={i} />)}
      </div>
    </section>
  );
}
