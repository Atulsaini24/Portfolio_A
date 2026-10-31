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
  email: "you@yourdomain.com",
  github: "https://github.com/YOUR_GITHUB_USERNAME",
  linkedin: "https://www.linkedin.com/in/YOUR_LINKEDIN_USERNAME/",
  timeZone: "Asia/Kolkata",
};

export type ProjectTone = "lime" | "lilac" | "bone" | "deep";
export type ProjectArtKind = "waves" | "flow" | "bars" | "mesh";

export type Project = {
  slug: string;
  name: string;
  kind: string;
  summary: string;
  stack: string[];
  role: string;
  tone: ProjectTone;
  art: ProjectArtKind;
  liveUrl?: string;
  sourceUrl?: string;
};

// TODO: verify each project's details, then add liveUrl / sourceUrl.
export const projects: Project[] = [
  {
    slug: "meet-ai",
    name: "Meet AI",
    kind: "AI meeting workspace",
    summary: "An AI-assisted meeting space that turns conversations into searchable knowledge and useful follow-ups.",
    stack: ["Next.js", "TypeScript", "Stream", "AI"],
    role: "Design and full-stack build",
    tone: "lime",
    art: "waves",
  },
  {
    slug: "scrapeflow",
    name: "ScrapeFlow",
    kind: "Visual web scraping",
    summary: "Build data extraction workflows visually, without writing selectors by hand.",
    stack: ["Next.js", "Node.js", "Prisma", "Automation"],
    role: "Design and full-stack build",
    tone: "lilac",
    art: "flow",
  },
  {
    slug: "moneymate",
    name: "MoneyMate",
    kind: "Personal finance",
    summary: "Track budgets, understand spending and make clearer money decisions.",
    stack: ["React", "TypeScript", "Analytics"],
    role: "Design and front-end build",
    tone: "bone",
    art: "bars",
  },
  {
    slug: "meshrelay",
    name: "MeshRelay",
    kind: "Offline disaster communication",
    summary: "Peer-to-peer messaging that keeps people connected when networks go down.",
    stack: ["Bluetooth", "Wi-Fi Direct", "DTN", "AI"],
    role: "Research and prototype",
    tone: "deep",
    art: "mesh",
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
