"use client";

import dynamic from "next/dynamic";
import type { ProjectDemoKind } from "@/data/site";

const Loading = () => <div className="demo demo-loading" aria-hidden="true" />;
const DEMOS = {
  mesh: dynamic(() => import("./MeshDemo"), { ssr: false, loading: Loading }),
  ledger: dynamic(() => import("./LedgerDemo"), { ssr: false, loading: Loading }),
  heal: dynamic(() => import("./HealDemo"), { ssr: false, loading: Loading }),
};

const CAPTIONS: Record<ProjectDemoKind, string> = {
  mesh: "A simulation of MeshRelay’s routing. Phones only reach neighbours in radio range, and when there’s no route the packet waits on the phone holding it until one appears.",
  ledger: "MoneyMate’s filtering engine, running on generated transactions in your browser. Type, and watch the time.",
  heal: "A simplified version of ScrapeFlow’s self-healing selector. Redesign the page, then run the scraper.",
};

/** A small, real, interactive version of the project, shown inside its drawer. */
export function ProjectDemo({ kind }: { kind: ProjectDemoKind }) {
  const Demo = DEMOS[kind];
  return (
    <section className="demo-wrap" aria-label="Interactive demo">
      <h4>Try it here</h4>
      <p className="demo-caption">{CAPTIONS[kind]}</p>
      <Demo />
    </section>
  );
}
