# VOLARA One — scroll-driven landing page

A single-page, scroll-driven motion landing page for the fictional **VOLARA One**
autonomous camera drone. Built per the project's `copy/brand-kit.md` and the
`BRAND-landing` project skill.

The centerpiece is a **fixed, full-screen background video that scrubs with
scroll** — the page content scrolls over it, with dark tints and gradients for
readability. It is *not* a small embedded player.

## Stack

- **Vite** (vanilla JS, ES modules)
- **GSAP** + **ScrollTrigger** — scroll-driven animation and pinned sections
- **Lenis** — smooth scrolling
- Brand tokens (color, type) as CSS variables in `src/style.css`

## Pages

A **multi-page** site (Vite MPA — each HTML file is its own route):

- `index.html` — the scroll-driven landing page
- `preorder.html` — a separate pre-order page with an edition selector, quantity
  stepper, and a live order summary

## Structure

```
website/
├─ index.html          # landing page markup + Google Fonts
├─ preorder.html       # pre-order page markup
├─ vite.config.js      # MPA config (both HTML files as entries)
├─ src/
│  ├─ main.js          # Lenis, ScrollTrigger, video scrub, section motion
│  ├─ preorder.js      # pre-order configurator + form
│  ├─ style.css        # tokens, layout, background layers, sections
│  ├─ preorder.css     # pre-order page styles
│  └─ glass.css        # glass panels, cards, buttons
└─ public/
   ├─ bg.mp4           # scroll-scrubbed background video (optional — see below)
   └─ img/             # product renders (hero, material, workspace)
```

## Run it

```bash
cd website
npm install
npm run dev
```

Then open the printed URL (default http://localhost:5173).

## Build

```bash
npm run build          # outputs to website/dist (base "./" → portable)
npm run preview        # preview the production build over HTTP
```

Preview the build over HTTP, never `file://`.

## The background video

The site looks for **`public/bg.mp4`**.

- **It is not included** — a cinematic dark fallback background is shown and the
  whole site works without it. When a `public/bg.mp4` is added, the video loads
  and scrubs with scroll automatically (no code changes needed).
- For smooth scroll-scrubbing, re-encode the video to all-keyframe H.264 before
  adding it (e.g. `ffmpeg -i in.mp4 -an -c:v libx264 -g 1 -keyint_min 1
  -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart public/bg.mp4`).

## Sections (landing page)

1. Hero · 2. Impact statement (pinned word reveal) · 3. Cinema-grade image ·
4. Autonomy & flight · 5. Design & materials · 6. Made for creators (pinned
card gallery, stacks on mobile) · 7. Specs · 8. Pre-order lead-in → **pre-order
page** · 9. Footer

## Verifying motion in a preview

Dev hooks are exposed in development:

```js
window.__bgv.readyState   // 4 once bg.mp4 is loaded
window.__bgv.duration
window.__ST.refresh()
```

Note: some previews throttle animation when the tab is backgrounded — verify in
a foreground browser tab if reveals look frozen.
