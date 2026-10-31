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

export default function Portfolio() {
  return (
    <SiteProvider>
      <Loader />
      <Cursor />
      <Nav />
      <main>
        <Hero />
        <About />
        <Work />
        <ToolsGlobe />
        <FlappyRaven />
        <Contact />
      </main>
    </SiteProvider>
  );
}
