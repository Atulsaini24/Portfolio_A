"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { site } from "@/data/site";
import { useSite } from "@/lib/site-context";
import { EASE_OUT, hasFinePointer, prefersReducedMotion } from "@/lib/motion";
import { useProximityType } from "@/lib/use-proximity-type";
import { RollText } from "../RollText";
import { ShootingSignature } from "../hero/ShootingSignature";

function useIndiaTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: site.timeZone });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function Contact() {
  const { navigate, replayIntro, toast, setQuickView, hasResume } = useSite();
  const time = useIndiaTime();
  const headRef = useRef<HTMLHeadingElement>(null);
  useProximityType(headRef, ".l", { base: 800, max: 300, wdth: [75, 100], radius: 260, pull: 8, tint: true });
  const heading = ["Let’s build", "something", "good"];
  let li = 0;
  const mx = useMotionValue(0), my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 220, damping: 14, mass: 0.6 });
  const y = useSpring(my, { stiffness: 220, damping: 14, mass: 0.6 });

  const magnet = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (!hasFinePointer() || prefersReducedMotion()) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left - r.width / 2) * 0.35);
    my.set((e.clientY - r.top - r.height / 2) * 0.35);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      toast("Email copied");
    } catch {
      toast(site.email);
    }
  };

  return (
    <section className="contact" id="contact">
      <div className="wrap">
        <motion.h2 ref={headRef} aria-label={heading.join(" ")} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }}>
          {heading.map((line) => (
            <span className="reveal-line" key={line} aria-hidden="true">
              {[...line].map((ch) => {
                const i = li++;
                return (
                  <motion.span
                    className="l" key={i}
                    variants={{ hidden: { y: "110%" }, show: { y: "0%" } }}
                    transition={{ duration: 0.9, delay: i * 0.025, ease: EASE_OUT }}
                  >
                    {ch === " " ? "\u00a0" : ch}
                  </motion.span>
                );
              })}
            </span>
          ))}
        </motion.h2>
        <div className="contact-row">
          <motion.a className="magnet" href={`mailto:${site.email}`} style={{ x, y }} onPointerMove={magnet} onPointerLeave={() => { mx.set(0); my.set(0); }}>
            <RollText>Say hello</RollText>
          </motion.a>
          <button className="mail" onClick={copy} aria-label={`Copy email address ${site.email}`}>
            <RollText>{site.email}</RollText>
          </button>
        </div>
        <ShootingSignature className="bigsig" />
      </div>
      <footer>
        <div className="wrap">
          <span>{site.name} · India{time && `, ${time}`}</span>
          <nav aria-label="Footer">
            <a href={site.github} target="_blank" rel="noopener"><RollText>GitHub</RollText></a>
            <a href={site.linkedin} target="_blank" rel="noopener"><RollText>LinkedIn</RollText></a>
            {hasResume && <a href={site.resume} target="_blank" rel="noopener"><RollText>Resume</RollText></a>}
            <button onClick={() => setQuickView(true)}><RollText>Recruiter view</RollText></button>
            <button onClick={replayIntro}><RollText>Replay intro</RollText></button>
            <button onClick={() => navigate("top")}><RollText>Back to top</RollText></button>
          </nav>
        </div>
      </footer>
    </section>
  );
}
