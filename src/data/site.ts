// Edit everything about you here. The rest of the site reads from this file.

export const site = {
  name: "Atul Saini",
  role: "Full-stack developer and AI engineer",
  intro:
    "Full-stack developer and AI engineer in India, building products from the database to the last pixel of motion.",
  availability: "Available for internships and full-time roles",
  statement:
    "I’m Atul. I build AI products end to end, and I care just as much about how they feel as how they work. Give me a fuzzy idea and I’ll hand back something people actually enjoy using.",
  // TODO: replace with your real details before publishing.
  email: "atulsaini2496@gmail.com",
  github: "https://github.com/Atulsaini24",
  linkedin: "https://www.linkedin.com/in/atul-saini-910838326/",
  timeZone: "Asia/Kolkata",
};

export type ProjectTone = "lime" | "lilac" | "bone" | "deep";
export type ProjectArtKind = "waves" | "flow" | "bars" | "mesh";

export type Project = {
  slug: string;
  name: string;
  kind: string;
  summary: string;
  problem: string;
  architecture: string;
  metric: string;
  stack: string[];
  role: string;
  tone: ProjectTone;
  art: ProjectArtKind;
  liveUrl?: string;
  sourceUrl?: string;
};

export const projects: Project[] = [
  {
    slug: "meet-ai",
    name: "Meet AI",
    kind: "AI meeting workspace",
    summary: "An AI-assisted meeting space that turns raw conversations into indexed semantic knowledge and automated follow-ups.",
    problem: "Meeting recordings are dense, unstructured, and rarely re-watched. Decisions and task assignments routinely get lost across scattered chat threads.",
    architecture: "Next.js App Router, Stream Video SDK for low-latency WebRTC streams, Whisper API for background speech transcription, and LLM structured tool-calling with pgvector in PostgreSQL for semantic search.",
    metric: "Sub-2s transcription indexing; eliminated manual post-meeting recap drafting.",
    stack: ["Next.js", "TypeScript", "Stream", "PostgreSQL", "OpenAI / Claude API"],
    role: "Full-stack architecture, LLM pipeline, and interface design",
    tone: "lime",
    art: "waves",
    sourceUrl: "https://github.com/Atulsaini24",
  },
  {
    slug: "scrapeflow",
    name: "ScrapeFlow",
    kind: "Visual web scraping",
    summary: "Build, orchestrate, and schedule resilient data extraction workflows visually without maintaining fragile manual selectors.",
    problem: "Web scraping scripts frequently break when target sites alter their DOM markup, requiring repetitive manual maintenance and downtime.",
    architecture: "Node.js background workers, Puppeteer/Playwright browser automation, Prisma ORM with PostgreSQL for job queues, and an auto-healing selector algorithm based on DOM tree heuristics.",
    metric: "99.4% pipeline uptime across 15,000+ daily automated data extraction runs.",
    stack: ["Next.js", "Node.js", "Prisma", "PostgreSQL", "Puppeteer", "Docker"],
    role: "System architecture, distributed worker queue, and frontend build",
    tone: "lilac",
    art: "flow",
    sourceUrl: "https://github.com/Atulsaini24",
  },
  {
    slug: "moneymate",
    name: "MoneyMate",
    kind: "Personal finance",
    summary: "High-performance personal finance tracking and cash-flow intelligence platform with instant client-side analytics.",
    problem: "Traditional budgeting apps are cluttered with third-party ads, lag on historical ledger queries, and fail to provide actionable cash-flow projections.",
    architecture: "React 19 with optimistic state transitions, IndexedDB offline caching via Dexie, custom vector-math SVG charting for 60fps financial breakdowns, and AES-256 encrypted local data storage.",
    metric: "<50ms client-side transaction filtering and aggregation across 10,000+ line items.",
    stack: ["React", "TypeScript", "Tailwind CSS", "Dexie / IndexedDB", "Web Crypto API"],
    role: "Product design, front-end architecture, and custom charting engine",
    tone: "bone",
    art: "bars",
    sourceUrl: "https://github.com/Atulsaini24",
  },
  {
    slug: "meshrelay",
    name: "MeshRelay",
    kind: "Offline disaster communication",
    summary: "Decentralized peer-to-peer messaging mesh utilizing Delay-Tolerant Networking (DTN) to keep people connected when networks collapse.",
    problem: "Natural catastrophes and power grid blackouts sever cellular networks, leaving emergency responders and families completely disconnected.",
    architecture: "Bluetooth Low Energy (BLE) and Wi-Fi Direct ad-hoc peer mesh protocol, store-and-forward Delay-Tolerant Networking (DTN) packet routing, and ephemeral cryptographic key exchange.",
    metric: "Tested reliable multi-hop packet routing up to 8 hops with 0% cellular/internet dependence.",
    stack: ["TypeScript", "Bluetooth LE", "Wi-Fi Direct", "DTN Routing", "Cryptography"],
    role: "Protocol design, routing algorithm research, and prototype application",
    tone: "deep",
    art: "mesh",
    sourceUrl: "https://github.com/Atulsaini24",
  },
];

export const capabilities = [
  { title: "Full-stack engineering", detail: "Component systems, APIs, data models and deployment." },
  { title: "AI products", detail: "Connecting models and automation to real workflows." },
  { title: "Interaction and motion", detail: "Interfaces that feel responsive, tactile and intentional." },
  { title: "Product thinking", detail: "Turning ambiguous problems into focused software." },
];

export const technologies = [
  "TypeScript", "JavaScript", "Python", "React", "Next.js", "Node.js", "Express", "PostgreSQL",
  "Prisma", "Drizzle", "Tailwind", "Three.js", "Motion", "Git", "Docker", "AI APIs",
  "Pandas", "scikit-learn", "Stream", "Figma",
];

// Shown when a tool on the 3D globe is hovered or tapped. Edit freely.
export const toolNotes: Record<string, string> = {
  TypeScript: "My default language for anything that ships.",
  JavaScript: "The web’s native tongue, for quick experiments.",
  Python: "AI, data wrangling and automation scripts.",
  React: "Component systems and interactive UIs.",
  "Next.js": "The framework behind most of my products.",
  "Node.js": "Servers, workers and CLIs.",
  Express: "Lightweight APIs when I need full control.",
  PostgreSQL: "My database of choice for real data.",
  Prisma: "Type-safe database access and migrations.",
  Drizzle: "SQL-first ORM for lean, fast queries.",
  Tailwind: "Fast, consistent styling.",
  "Three.js": "3D on the web, like the globe you’re spinning.",
  Motion: "Springs, gestures and scroll animation.",
  Git: "Version control for everything.",
  Docker: "Reproducible environments and deploys.",
  "AI APIs": "LLMs wired into real workflows.",
  Pandas: "Cleaning and exploring datasets.",
  "scikit-learn": "Classic machine learning models.",
  Stream: "Real-time video and chat.",
  Figma: "Where interfaces start.",
};
