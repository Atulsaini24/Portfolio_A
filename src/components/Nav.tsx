"use client";

import { motion, useMotionValueEvent, useScroll } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSite } from "@/lib/site-context";
import { site } from "@/data/site";
import { RollText } from "./RollText";

const LINKS = [
  { id: "about", label: "About" },
  { id: "work", label: "Work" },
  { id: "tools", label: "Tools" },
  { id: "play", label: "Play" },
];
const SHEET_LINKS = [...LINKS.filter((l) => l.id !== "tools"), { id: "contact", label: "Contact" }];

export function Nav() {
  const { navigate, lock, unlock } = useSite();
  const [hovered, setHovered] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > prev && y > 160 && !open);
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

  return (
    <>
      <header className={`nav${hidden ? " hide" : ""}`}>
        <div className="wrap">
          <a href="#top" className="brand" onClick={go("top")} aria-label={`${site.name}, back to top`}>
            <Image src="/assets/raven.png" alt="" width={46} height={40} priority />
            <span>{site.name}</span>
          </a>

          <nav className="pill" aria-label="Main" onPointerLeave={() => setHovered(null)}>
            {LINKS.map((l) => (
              <a key={l.id} href={`#${l.id}`} onClick={go(l.id)} onPointerEnter={() => setHovered(l.id)} onFocus={() => setHovered(l.id)} className={hovered === l.id ? "on" : ""}>
                {hovered === l.id && (
                  <motion.span layoutId="nav-blob" className="blob" transition={{ type: "spring", stiffness: 420, damping: 32 }} />
                )}
                <span className="label">{l.label}</span>
              </a>
            ))}
          </nav>

          <a href="#contact" className="cta" onClick={go("contact")}>
            <RollText>Let’s talk</RollText>
            <i className="ic" />
          </a>

          <button className={`menu-btn${open ? " open" : ""}`} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="sheet" onClick={() => setOpen((o) => !o)}>
            <i /><i />
          </button>
        </div>
      </header>

      <div id="sheet" className={`sheet${open ? " open" : ""}`} aria-hidden={!open} inert={!open}>
        {SHEET_LINKS.map((l, i) => (
          <a key={l.id} href={`#${l.id}`} onClick={go(l.id)} style={{ "--d": `${i * 0.06}s` } as React.CSSProperties}>
            <span>{l.label}</span>
          </a>
        ))}
        <p>Open to internships, full-time roles and collaborations.</p>
      </div>
    </>
  );
}
