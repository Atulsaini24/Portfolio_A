# Atul Saini – Portfolio

A motion-led portfolio built with Next.js (App Router), React 19, Motion, Lenis and React Three Fiber.
The colours come straight from the intro video: forest `#1E3422`, lime `#C9F28C` and lilac `#B0A1F9`.

## Run it

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev        # http://localhost:3000
```

Production check:

```bash
npm run typecheck
npm run build
npm start
```

## Before you publish

Open `src/data/site.ts` and replace:

- `email`, `github` and `linkedin` (they are placeholders)
- each project's `summary`, `stack` and `role`, and add `liveUrl` / `sourceUrl` once they are public

Everything on the page reads from that file.

## What's where

| File | What it does |
| --- | --- |
| `src/components/Loader.tsx` | Intro video with a % counter whose colour follows the video, then a three-colour wipe. Plays once per tab; "Replay intro" in the footer plays it again. |
| `src/components/Nav.tsx` | Floating pill nav with a springy highlight (Motion `layoutId`), hides on scroll down, full-screen circle menu on mobile. |
| `src/lib/site-context.tsx` | Smooth scroll (Lenis), the swipe page transition, scroll locking, intro state and the toast. |
| `src/components/hero/ParticlePortrait.tsx` | Halftone particle portrait: assembles on intro, flees the cursor, scatters on click. |
| `src/components/hero/Signature.tsx` | The hand-drawn "Atul Saini" signature (path data in `src/data/signature.ts`). |
| `src/components/hero/HeroName.tsx` | Name letters rise in, then swell in weight near the cursor (variable font). |
| `src/components/sections/About.tsx` | Statement that lights up word by word as you scroll. |
| `src/components/sections/Work.tsx` | Horizontal scroll project gallery with 3D tilt; opens `ProjectDrawer.tsx`. |
| `src/components/tools/*` | Draggable 3D tools globe (React Three Fiber) with an automatic 2D canvas fallback when WebGL is unavailable. |
| `src/components/sections/FlappyRaven.tsx` | The game. Best score is saved in localStorage. |
| `src/components/sections/Contact.tsx` | Magnetic "Say hello" button, click-to-copy email, live India time. |
| `src/components/Cursor.tsx` | Custom cursor (desktop only). Add `data-cursor="Label"` to any element to show a label. |

## Assets

- `public/assets/intro-loader.mp4` – your loading animation
- `public/assets/portrait-particles.png` – background-removed, contrast-adjusted portrait used to place the particles. To use a different photo, cut it out on a transparent background, convert to grayscale, and keep it around 200 px wide.
- `public/assets/raven.png` – your logo with a transparent background (nav, swipe transition, game, favicon)

## Accessibility and performance

- `prefers-reduced-motion` turns off smooth scrolling, the intro video, particle motion and scroll effects.
- The custom cursor and hover effects only run on devices with a mouse.
- The 3D globe loads only when you scroll near it, and the particle canvas and game pause when off screen.
- The font is self-hosted from npm, so there is no request to Google Fonts.

## Dependency versions

Versions are pinned exactly. Releases published in the two weeks before this update were skipped on purpose, because brand-new releases are where supply-chain attacks usually land. Upgrade deliberately, not automatically.

## Deploy

Push to GitHub, import the repo into Vercel, keep the default build command (`npm run build`) and deploy.
