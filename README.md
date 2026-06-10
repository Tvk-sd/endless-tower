# Endless Tower

A mobile-native task app where every task is a stone. Stack them. Complete them. Save your towers.

## Concept
Tasks are physical objects — irregular stones that stack on top of each other. The tower grows upward as you add tasks. Completing a task fills the stone with colour. When you're done, save the tower and start a new one.

**Interactions:**
- Tap a stone → see details (date, priority, delete)
- Hold a stone → fill animation, releases to complete
- Drag a stone → reorder (incomplete stones only)
- + button → add a new stone at the bottom
- Save → name and archive the current tower
- Towers → browse saved tower history

## Running locally

```bash
cd app
npm install
npm run dev
```

Opens at `http://localhost:3000`. Best viewed at mobile viewport (375×812 or 390×844).

## Tech
Next.js 14 · TypeScript · Tailwind v4 · No backend · localStorage persistence

## File map
```
app/
  app/page.tsx            Root page + mobile frame
  components/             All UI screens and components
  lib/store.ts            State persistence (localStorage)
  lib/stone-paths.ts      Stone SVG shapes + utilities
  styles/globals.css      Animations and global styles
Research images/          Design references and Figma explorations
CLAUDE.md                 Claude Code project instructions
HANDOFF.md                Current session state and next steps
```
