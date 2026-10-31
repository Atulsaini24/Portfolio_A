"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import type { Project } from "@/data/site";
import { useSite } from "@/lib/site-context";
import { EASE_OUT } from "@/lib/motion";
import { ProjectArt, TONE_BG, inkFor } from "./ProjectArt";

export function ProjectDrawer({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const { lock, unlock } = useSite();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!project) return;
    lock("drawer");
    const opener = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => closeRef.current?.focus(), 300);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", onKey);
    return () => { unlock("drawer"); clearTimeout(t); removeEventListener("keydown", onKey); opener?.focus(); };
  }, [project, lock, unlock, onClose]);

  return (
    <AnimatePresence>
      {project && (
        <div className="drawer" key={project.slug}>
          <motion.div className="scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside
            className="panel" role="dialog" aria-modal="true" aria-labelledby="drawer-title" data-lenis-prevent
            initial={{ x: "102%" }} animate={{ x: 0 }} exit={{ x: "102%" }}
            transition={{ duration: 0.75, ease: EASE_OUT }}
          >
            <button className="close" ref={closeRef} onClick={onClose} aria-label="Close project">✕</button>
            <div className="dart" style={{ background: TONE_BG[project.tone] }}>
              <div className="dart-inner"><ProjectArt kind={project.art} ink={inkFor(project.tone)} /></div>
            </div>
            <h3 id="drawer-title">{project.name}</h3>
            <p className="k">{project.kind}</p>
            <p>{project.summary}</p>
            <dl>
              <dt>Stack</dt><dd>{project.stack.join(", ")}</dd>
              <dt>My role</dt><dd>{project.role}</dd>
              <dt>Links</dt>
              <dd>
                {project.liveUrl || project.sourceUrl ? (
                  <>
                    {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noopener">Live site</a>}
                    {project.liveUrl && project.sourceUrl && ", "}
                    {project.sourceUrl && <a href={project.sourceUrl} target="_blank" rel="noopener">Source code</a>}
                  </>
                ) : (
                  "Live demo and source coming soon"
                )}
              </dd>
            </dl>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
