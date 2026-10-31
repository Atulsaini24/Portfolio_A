"use client";

import { SiteProvider } from "@/lib/site-context";
import { Cursor } from "./Cursor";
import { Loader } from "./Loader";
import { Nav } from "./Nav";
import { Hero } from "./hero/Hero";
import { About } from "./sections/About";
import { Work } from "./sections/Work";
import { ToolsGlobe } from "./tools/ToolsGlobe";
import { FlappyRaven } from "./sections/FlappyRaven";
import { Contact } from "./sections/Contact";
import { VelocityMarquee } from "./VelocityMarquee";
import { AskAtul } from "./ask/AskAtul";
import { QuickView } from "./QuickView";

export default function Portfolio() {
  return (
    <SiteProvider>
      <Loader />
      <Cursor />
      <Nav />
      <main>
        <Hero />
        <div className="bands">
          <VelocityMarquee className="band-lime" baseVelocity={-2.5} items={["Full-stack", "AI products", "Motion", "3D on the web", "Product thinking"]} />
          <VelocityMarquee className="band-ink" baseVelocity={2} items={["Next.js", "TypeScript", "Python", "Three.js", "PostgreSQL", "LLMs"]} />
        </div>
        <About />
        <Work />
        <ToolsGlobe />
        <FlappyRaven />
        <Contact />
      </main>
      <AskAtul />
      <QuickView />
    </SiteProvider>
  );
}
