"use client";

import { motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { projects, type Project } from "@/data/site";
import { useSite } from "@/lib/site-context";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";
import { RollText } from "../RollText";
import { ProjectArt, inkFor } from "./ProjectArt";
import { ProjectDrawer } from "./ProjectDrawer";

function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const rx = useMotionValue(0), ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 260, damping: 24 });
  const rotateY = useSpring(ry, { stiffness: 260, damping: 24 });
  const tilt = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!hasFinePointer() || prefersReducedMotion()) return;
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 7);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 7);
  };
  return (
    <motion.button
      className="card" data-tone={project.tone} data-cursor="Open" onClick={onOpen}
      onPointerMove={tilt} onPointerLeave={() => { rx.set(0); ry.set(0); }}
      style={{ rotateX, rotateY, transformPerspective: 1200 }}
    >
      <div className="art"><ProjectArt kind={project.art} ink={inkFor(project.tone)} /></div>
      <span className="kind">{project.kind}</span>
      <div>
        <h3>{project.name}</h3>
        <p className="sum">{project.summary}</p>
        <div className="chips">{project.stack.map((s) => <span key={s}>{s}</span>)}</div>
      </div>
    </motion.button>
  );
}

export function Work() {
  const { navigate } = useSite();
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const [open, setOpen] = useState<Project | null>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, (p) => -p * distance);

  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      const horizontal = window.matchMedia("(min-width: 861px)").matches;
      setDistance(track && horizontal ? Math.max(0, track.scrollWidth - window.innerWidth) : 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    addEventListener("resize", measure);
    return () => { ro.disconnect(); removeEventListener("resize", measure); };
  }, []);

  const close = useCallback(() => setOpen(null), []);

  return (
    <section className="work" id="work">
      <div className="wrap work-head">
        <h2 className="h2">Things<br />I’ve built</h2>
        <p>Scroll to move through the projects. Open any card for the details.</p>
      </div>
      <div className="hscroll" ref={sectionRef}>
        <div className="hsticky">
          <motion.div className="track" ref={trackRef} style={{ x }}>
            {projects.map((p) => <ProjectCard key={p.slug} project={p} onOpen={() => setOpen(p)} />)}
            <div className="end">
              <p>More case studies are on the way.</p>
              <a href="#contact" className="cta" onClick={(e) => { e.preventDefault(); navigate("contact"); }}>
                <RollText>Ask me about them</RollText><i className="ic" />
              </a>
            </div>
          </motion.div>
          <div className="progress"><motion.i style={{ scaleX: scrollYProgress }} /></div>
        </div>
      </div>
      <ProjectDrawer project={open} onClose={close} />
    </section>
  );
}
