# Endless Tower — Claude Code Project Instructions

## What this project is
A mobile-native task management app where each task is a visual "stone" stacked into a tower. Built as a personal side project by Till. Aesthetic: minimal, tactile, organic. Think physical objects, not UI widgets.

## How to run
```bash
cd "/Users/Till/Documents/Endless Tower/app"
npm run dev        # dev server → http://localhost:3000
npx tsc --noEmit   # type check (run after any edit)
```

## Stack
- **Next.js 14** (App Router), **TypeScript**, **Tailwind v4**, **tw-animate-css**
- No backend — all state in `localStorage` via `lib/store.ts`
- No external UI libraries — all components are custom

## Project structure
```
/app
  app/page.tsx              — root page, mobile frame wrapper, screen routing
  components/
    main-screen.tsx         — core task screen (stone stack, add, complete, drag)
    archive-screen.tsx      — saved towers grid
    stone.tsx               — Stone + DecorativeStone SVG components
    stone-detail.tsx        — expanded stone panel (delete, priority)
    add-stone-button.tsx    — + button with inline input
    loading-screen.tsx      — splash / app name reveal
    onboarding-screen.tsx   — first-run instructions
    save-tower-dialog.tsx   — modal to name and save current tower
  lib/
    stone-paths.ts          — SVG paths, hashString(), getStackOverlap()
    store.ts                — localStorage load/save, type definitions
  styles/globals.css        — CSS custom properties + @keyframes animations
```

## Key design decisions (do not change without checking)
- **Stone shapes**: 10 angular SVG paths in `lib/stone-paths.ts`. Angular by design — user tested smooth bezier curves and preferred the originals.
- **Tower layout**: bottom-anchored flex (`justifyContent: flex-end`) so 1–2 stones sit near the + button, not at the top of empty space.
- **Stone sizing**: `STONE_H = 208px`, `STEP = 136px` (overlap = 72px). `towerH` is calculated from these.
- **Mobile frame**: `100dvh`, `min(390px, 100vw)` — fills full screen on mobile, framed on desktop.
- **Typography system**: all nav-level text is `11px` + `letterSpacing: 0.04em`. Do not deviate.
- **Completion colors**: defined in `COMPLETION_COLORS` array in `stone-paths.ts`. Color chosen by `hashString(id)`.

## Animation system
- `stone-drop` keyframe in `globals.css` — used for new stone fall-in
- Applied via `.stone-fall` class on a wrapper div in `main-screen.tsx`
- `newStoneId` state tracks which stone is animating (cleared after 900ms)
- Duration: `520 + (hashString(id) % 200)ms` — varies per stone

## Patterns to follow
- Stone shape is always determined by `hashString(id)` — deterministic, not random at runtime
- All stone transforms (rotation, offsetX) are derived from the same hash — consistent per task
- `getStackOverlap()` is available but currently not used in the main stack (fixed STEP is used instead)
- Drag-to-reorder only works on non-completed stones
- Hold-to-complete: 300ms to start, 1200ms to fill — tracked via `holdTimerRef`

## Reference material
- `/Research images/Stones.png` — physical stone reference (pebbles, beach stones)
- `/Research images/Desktop - *.png` — Figma design explorations
- `/Research images/Frame.png` — layout reference
