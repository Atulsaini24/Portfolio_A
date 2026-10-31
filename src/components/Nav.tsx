"use client";

import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useScroll, useSpring } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { site } from "@/data/site";
import { useSite } from "@/lib/site-context";
import { EASE_OUT, hasFinePointer } from "@/lib/motion";
import { Magnetic } from "./Magnetic";
import { RollText } from "./RollText";

const LINKS = [
  { id: "about", label: "About" },
  { id: "work", label: "Work" },
  { id: "tools", label: "Tools" },
  { id: "play", label: "Play" },
];
const SHEET_LINKS = [...LINKS, { id: "contact", label: "Contact" }];

/** The raven logo turns its head toward the cursor and does a flip on hover. */
function RavenLogo() {
  const ref = useRef<HTMLSpanElement>(null);
  const target = useMotionValue(0);
  const rotate = useSpring(target, { stiffness: 120, damping: 14 });
  useEffect(() => {
    if (!hasFinePointer()) return;
    const move = (e: PointerEvent) => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      const angle = (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
      // The raven faces right, so 0° means "looking at the cursor". Keep it a believable head tilt.
      target.set(Math.max(-28, Math.min(28, angle > 90 ? 180 - angle : angle < -90 ? -180 - angle : angle)) * 0.8);
    };
    addEventListener("pointermove", move, { passive: true });
    return () => removeEventListener("pointermove", move);
  }, [target]);
  return (
    <motion.span ref={ref} className="raven" style={{ rotate }} whileHover={{ scale: 1.12 }}>
      <Image src="/assets/raven.png" alt="" width={46} height={40} priority />
    </motion.span>
  );
}

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    const top = () => window.scrollY < window.innerHeight * 0.5 && setActive(null);
    addEventListener("scroll", top, { passive: true });
    return () => { io.disconnect(); removeEventListener("scroll", top); };
  }, [ids]);
  return active;
}

const SECTION_IDS = SHEET_LINKS.map((l) => l.id);

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

export function Nav() {
  const { navigate, lock, unlock, introRun, setAskOpen, setQuickView, hasResume } = useSite();
  const [mac, setMac] = useState(true);
  useEffect(() => setMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)), []);
  const [hovered, setHovered] = useState<string | null>(null);
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const active = useActiveSection(SECTION_IDS);
  const time = useIndiaTime();
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  const shown = introRun > 0;

  useMotionValueEvent(scrollY, "change", (y) => {
    setCompact(y > 80);
  });

  useEffect(() => {
    if (open) lock("menu");
    else unlock("menu");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open, lock, unlock]);

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    navigate(id);
  };

  const drop = (i: number) => ({
    initial: { y: -40, opacity: 0, filter: "blur(6px)" },
    animate: shown ? { y: 0, opacity: 1, filter: "blur(0px)" } : undefined,
    transition: { duration: 0.9, delay: 0.25 + i * 0.07, ease: EASE_OUT },
  });

  return (
    <>
      <header className={`nav${compact ? " compact" : ""}${open ? " menu-open" : ""}`}>
        <div className="wrap">
          <motion.a href="#top" className="brand" onClick={go("top")} aria-label={`${site.name}, back to top`} {...drop(0)}>
            <RavenLogo />
            <span className="brand-name">{site.name}</span>
          </motion.a>

          <motion.nav className="pill" aria-label="Main" onPointerLeave={() => setHovered(null)} {...drop(1)}>
            {LINKS.map((l) => (
              <a
                key={l.id} href={`#${l.id}`} onClick={go(l.id)}
                onPointerEnter={() => setHovered(l.id)} onFocus={() => setHovered(l.id)} onBlur={() => setHovered(null)}
                className={hovered === l.id ? "on" : active === l.id ? "current" : ""}
                aria-current={active === l.id ? "true" : undefined}
              >
                {hovered === l.id && (
                  <motion.span layoutId="nav-blob" className="blob" transition={{ type: "spring", stiffness: 420, damping: 32 }} />
                )}
                <span className="label"><RollText>{l.label}</RollText></span>
                {active === l.id && (
                  <motion.span layoutId="nav-active" className="active-dot" transition={{ type: "spring", stiffness: 380, damping: 28 }} />
                )}
              </a>
            ))}
            <motion.span className="pill-progress" style={{ scaleX: progress }} aria-hidden="true" />
          </motion.nav>

          <motion.div className="nav-right" {...drop(2)}>
            <button className="ask-btn" onClick={() => setAskOpen(true)} aria-label="Ask Atul’s AI about his work">
              <span className="ask-btn-dot" aria-hidden="true" />
              <span className="ask-btn-label">Ask my AI</span>
              <kbd aria-hidden="true">{mac ? "⌘" : "Ctrl"} K</kbd>
            </button>
            {hasResume && (
              <a className="resume-btn" href={site.resume} target="_blank" rel="noopener">
                <RollText>Resume</RollText>
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M8 2v9m0 0L4 7m4 4 4-4M3 14h10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
            )}
            <Magnetic strength={0.35}>
              <a href="#contact" className="cta" onClick={go("contact")}>
                <RollText>Let’s talk</RollText>
                <i className="ic" />
              </a>
            </Magnetic>
            <button className={`menu-btn${open ? " open" : ""}`} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="sheet" onClick={() => setOpen((o) => !o)}>
              <i /><i />
            </button>
          </motion.div>
        </div>
      </header>

      <div id="sheet" className={`sheet${open ? " open" : ""}`} aria-hidden={!open} inert={!open}>
        <Image className="sheet-raven" src="/assets/raven.png" alt="" width={520} height={452} />
        <nav aria-label="Menu">
          {SHEET_LINKS.map((l, i) => (
            <a key={l.id} href={`#${l.id}`} onClick={go(l.id)} style={{ "--d": `${0.15 + i * 0.06}s` } as React.CSSProperties} className={active === l.id ? "current" : ""}>
              <span>{l.label}</span>
            </a>
          ))}
        </nav>
        <AnimatePresence>
          {open && (
            <motion.div className="sheet-foot" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }} exit={{ opacity: 0 }}>
              <p>Open to internships, full-time roles and collaborations.</p>
              <p className="sheet-actions">
                <button onClick={() => { setOpen(false); setAskOpen(true); }}>Ask my AI</button>
                <button onClick={() => { setOpen(false); setQuickView(true); }}>Recruiter view</button>
                {hasResume && <a href={site.resume} target="_blank" rel="noopener">Resume</a>}
              </p>
              <p>
                <a href={site.github} target="_blank" rel="noopener">GitHub</a>
                <a href={site.linkedin} target="_blank" rel="noopener">LinkedIn</a>
                <span>India{time && `, ${time}`}</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
