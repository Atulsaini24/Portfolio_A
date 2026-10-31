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
| `src/components/Loader.tsx` | Intro video with a rolling odometer counter whose colour follows the video, then a three-colour wipe. Plays on every load and refresh; "Replay intro" in the footer plays it again. |
| `src/components/hero/HeroScene.tsx` | The hero canvas: star field, cursor glow, rim light and the signature written by a shooting star, all drawn **behind** the portrait (Atul's silhouette is cut out of that layer). On top: the halftone particle portrait, which flees the cursor, scatters on click with a shockwave, and dissolves as you scroll. |
| `src/components/hero/Hero.tsx`, `HeroName.tsx` | Name letters flip up on intro and swell toward the cursor; the intro line decodes (`ScrambleText.tsx`); scroll cue; copy parallax on scroll. |
| `src/components/Nav.tsx` | Drops in after the intro. Lime hover blob that springs between links, a dot under the section you're in, a scroll-progress line, compacts after scrolling, hides on scroll down. The raven logo turns to follow the cursor. Magnetic "Let's talk" button. Full-screen mobile menu with socials and local time. |
| `src/components/VelocityMarquee.tsx` | The two crossing bands under the hero. They speed up and lean with your scroll velocity. |
| `src/components/raven/*` | The 3D raven: the logo traced to vector (`src/data/raven-shape.ts`) and extruded with Three.js. It follows the cursor, sways with scroll, and flips with a "caw" when clicked. |
| `src/components/sections/About.tsx` | Statement that lights up word by word on scroll, the 3D raven, and capability cards with a cursor spotlight. |
| `src/components/sections/Work.tsx` | Horizontal scroll gallery. Cards tilt in 3D, lean with scroll speed, and their art animates on hover. Opens `ProjectDrawer.tsx`. |
| `src/components/tools/*` | Draggable 3D tools globe. Hover or tap a tool to see what it's used for (edit `toolNotes` in `site.ts`). Automatic 2D fallback without WebGL. |
| `src/components/sections/FlappyRaven.tsx` | The game: synthesized sound effects and chiptune music (`src/lib/sound.ts`), mute button, rising difficulty, sky changes every 10 points, confetti on a new best. |
| `src/components/sections/Contact.tsx` | Heading letters react to the cursor, magnetic "Say hello", click-to-copy email, signature written by a shooting star (`hero/ShootingSignature.tsx`). |
| `src/components/Cursor.tsx` | Custom cursor that stretches with speed. Add `data-cursor="Label"` to any element to show a label. |
| `src/lib/site-context.tsx` | Smooth scroll (Lenis), swipe page transition, scroll locking, intro state, toast. |

## Sound

All game audio is generated in the browser with the Web Audio API, so there are no audio files. Browsers only allow sound after a click, tap or key press, so the music starts on the first flap. The mute choice is remembered.

## Assets

- `public/assets/intro-loader.mp4` – your loading animation
- `public/assets/portrait-particles.png` – background-removed, contrast-adjusted portrait used to place the particles. To use a different photo, cut it out on a transparent background, convert to grayscale, and keep it around 200 px wide.
- `public/assets/raven.png` – your logo with a transparent background (nav, swipe transition, game, favicon)

## Accessibility and performance

- `prefers-reduced-motion` turns off smooth scrolling, the intro video, particle motion and scroll effects.
- The custom cursor and hover effects only run on devices with a mouse.
- The 3D raven and globe load only when you scroll near them, and the hero canvas and game pause when off screen.
- Hero physics is time-based, so the portrait assembles at the same speed on slow and fast devices.
- The font is self-hosted from npm, so there is no request to Google Fonts.

## Dependency versions

Versions are pinned exactly. Releases published in the two weeks before this update were skipped on purpose, because brand-new releases are where supply-chain attacks usually land. Upgrade deliberately, not automatically.

## Deploy

Push to GitHub, import the repo into Vercel, keep the default build command (`npm run build`) and deploy.
