# Impostor — Interactive Arcade Website Prototype

A polished single-page website concept for **Impostor**, designed around a retro arcade cabinet, neon social-deduction tension, and game-like UI feedback.

## Included
- `index.html` — semantic landing page structure
- `styles.css` — retro neon arcade UI system, responsive layout, pixel-style components
- `app.js` — interaction layer with GSAP, ScrollTrigger, Three.js ambience, lobby scanning, room code generation, magnetic hover states, pixel bursts, audio toggle

## Experience notes
- Hero uses an arcade cabinet metaphor with a glowing CRT, crew lineup, impostor spotlight, CTA deck, and ticker.
- Background uses Three.js for a lightweight starfield and floating token field when the CDN is available.
- GSAP powers intro sequencing, scroll reveals, magnetic micro-interactions, lobby scan animations, and glitch moments.
- Vanilla JavaScript fallbacks keep the page usable even if CDN libraries fail to load.
- Motion honors `prefers-reduced-motion`.
- The UI is responsive and remains playable on smaller screens.

## How to run
Open `index.html` in a modern browser. Internet access is recommended so GSAP, ScrollTrigger, Three.js, and the optional Google Fonts can load from their CDNs.
