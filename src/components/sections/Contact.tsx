"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";
import { site } from "@/data/site";
import { useSite } from "@/lib/site-context";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";
import { RollText } from "../RollText";
import { Signature } from "../hero/Signature";

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
  const { navigate, replayIntro, toast } = useSite();
  const time = useIndiaTime();
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
        <h2>Let’s build something good</h2>
        <div className="contact-row">
          <motion.a className="magnet" href={`mailto:${site.email}`} style={{ x, y }} onPointerMove={magnet} onPointerLeave={() => { mx.set(0); my.set(0); }}>
            <RollText>Say hello</RollText>
          </motion.a>
          <button className="mail" onClick={copy} aria-label={`Copy email address ${site.email}`}>
            <RollText>{site.email}</RollText>
          </button>
        </div>
        <Signature className="bigsig" duration={3.6} fill={0} />
      </div>
      <footer>
        <div className="wrap">
          <span>{site.name} · India{time && `, ${time}`}</span>
          <nav aria-label="Footer">
            <a href={site.github} target="_blank" rel="noopener"><RollText>GitHub</RollText></a>
            <a href={site.linkedin} target="_blank" rel="noopener"><RollText>LinkedIn</RollText></a>
            <button onClick={replayIntro}><RollText>Replay intro</RollText></button>
            <button onClick={() => navigate("top")}><RollText>Back to top</RollText></button>
          </nav>
        </div>
      </footer>
    </section>
  );
}
