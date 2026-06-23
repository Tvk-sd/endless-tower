# Endless Tower — Mobile Keyboard & Platform Strategy

**Status:** Draft for decision · **Date:** Jun 10 2026  
**Problem owner:** Till  
**Trigger:** On iPhone (Safari / Add to Home Screen), opening the keyboard to add or edit a stone makes the tower jump up and down. The interaction feels clunky and breaks the calm, physical metaphor.

This document explains *why* that happens, what you can do while staying a web app, and what changes if you go native on iOS. It is a decision plan, not an implementation spec.

---

## 1. What you’re feeling

When you tap **+** or edit a stone’s text, three things often happen at once on iOS:

1. **The viewport shrinks** — Safari treats the keyboard as eating into the visible area. Units like `dvh` (dynamic viewport height) recalculate, so the app shell gets shorter.
2. **The tower reflows** — The stack is bottom-anchored (`justifyContent: flex-end`). A shorter container pushes stones upward.
3. **The browser scrolls to the focused input** — iOS tries to keep the caret visible, which can scroll the tower area and fight your layout.

You already fixed one related issue: the add area has a fixed height (`ADD_AREA_H = 96`) so toggling between **+** and the input doesn’t shift the tower. The keyboard problem is separate and bigger — it resizes the *whole* screen, not just the footer.

**Inputs that trigger this today**

| Surface | Location | Severity |
|---------|----------|----------|
| Add stone | Footer (`add-stone-button.tsx`) | High — keyboard covers footer; layout resizes |
| Inline edit | Inside stone in stack (`stone.tsx`) | High — focus mid-screen; scroll + resize |
| Save tower | Modal dialog (`save-tower-dialog.tsx`) | Medium — overlay, but still resizes shell |

---

## 2. Root cause (technical, in plain language)

```
┌─────────────────────────────┐
│  App shell: h-dvh            │  ← height tied to “visible” viewport
│  ┌─────────────────────────┐│
│  │ Scrollable tower stack   ││  ← bottom-anchored; reflows when shell shrinks
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ Add area (fixed 96px)    ││  ← stable on toggle, not on keyboard
│  └─────────────────────────┘│
└─────────────────────────────┘
         ↓ keyboard opens
┌─────────────────────────────┐
│  Smaller dvh                 │  ← entire shell compresses
│  Tower jumps up              │
│  Browser may scroll stack    │
└─────────────────────────────┘
```

**Relevant code today**

- Shell height: `h-dvh` in `app/page.tsx`
- Overflow locked: `html, body { overflow: hidden }` in `globals.css`
- No `visualViewport` listener
- No keyboard-specific layout mode

iOS Safari is the hardest environment. Android Chrome behaves similarly but is often slightly less jarring. Desktop is unaffected (no virtual keyboard).

---

## 3. Design principle to optimize for

> **While typing, the tower should not move.**

That implies one of:

- **Freeze the tower** — keyboard opens, layout stays visually fixed (stones don’t reflow).
- **Hide the tower** — enter a dedicated “naming mode” where the stack is dimmed or off-screen; only the input matters.
- **Native keyboard contract** — the OS handles keyboard inset explicitly (best on true native iOS).

Everything below is a trade-off between fidelity to that principle, build cost, and how much of the current codebase you keep.

---

## 4. Path A — Stay a web app

You can improve mobile web without leaving Next.js / Vercel. Options are ordered from smallest to largest change.

### A1. Keyboard-stable shell (quick web fix)

**Idea:** Stop using live `dvh` while the keyboard is open. On first load (or on `visualViewport` resize), pin the app shell to a fixed pixel height and use `position: fixed` so the keyboard overlays content instead of compressing it.

**How**
- Listen to `window.visualViewport` `resize` / `scroll`
- When keyboard likely open (viewport height drops by > ~150px), set shell to `height: ${initialHeight}px` + `position: fixed`
- Optionally add bottom padding equal to keyboard overlap so the input stays above keys

**Pros:** Small diff, keeps current UX, no new screens  
**Cons:** Input can still sit under keyboard unless you pad/scroll manually; inline edit on a stone mid-stack remains awkward; behavior varies by iOS version  
**Effort:** ~1–2 days  
**Risk:** Medium — tuning per device; edge cases on rotate / split keyboard

---

### A2. Composition mode — “naming sheet” (recommended web UX)

**Idea:** Decouple typing from the tower entirely. Tapping **+** or **Edit** does *not* focus an input inside the stack. Instead:

1. Tower fades to ~15% opacity (same as expanded-stone fade)
2. A fixed **naming bar** appears above the keyboard — pinned with `visualViewport.offsetTop` + keyboard inset
3. On submit/cancel, bar dismisses and tower returns unchanged

Visually similar to iOS Messages compose or a minimal bottom sheet, but the input rides the keyboard.

**Pros:** Strongest fix while staying web; matches “calm, physical” tone; one pattern for add + edit + save  
**Cons:** New UI state; slight behavior change (no inline caret on the stone itself while editing)  
**Effort:** ~3–5 days including polish  
**Risk:** Low — predictable UX, testable

**Acceptance sketch**
- [ ] Opening keyboard never changes tower position or scale
- [ ] Add, edit, and save all use the same naming surface
- [ ] Cancel restores prior state with no scroll jump

---

### A3. Modal-only text entry

**Idea:** Like A2, but a centered or bottom modal (reuse save-dialog pattern) instead of a keyboard-attached bar.

**Pros:** Reuses existing dialog patterns; very stable layout  
**Cons:** Feels less native on phone; modal + keyboard can feel cramped  
**Effort:** ~2–3 days  
**Risk:** Low

---

### A4. PWA (Add to Home Screen)

**Idea:** Ship a proper web app manifest, icons, `display: standalone`, optional offline cache.

**Pros:** Full-screen chrome, app icon, shareable install  
**Cons:** **Does not fix keyboard** by itself — same WebKit engine, same `dvh` issues  
**Effort:** ~1 day (manifest + meta + icons)  
**Risk:** Low

**Verdict:** Worth doing *in addition* to A1 or A2, not *instead of* them.

---

### A5. Capacitor wrapper (hybrid “native” shell)

**Idea:** Wrap the existing Next.js app in a Capacitor iOS project. Use `@capacitor/keyboard` with `Keyboard.setResizeMode({ mode: 'none' })` so the WebView doesn’t shrink when the keyboard opens — then handle inset yourself (same as A2).

**Pros:** App Store distribution; push notifications later; keeps React codebase  
**Cons:** WebView still renders stones; haptics/native feel limited; build + signing overhead; App Store review  
**Effort:** ~1–2 weeks first time (tooling, icons, provisioning)  
**Risk:** Medium — hybrid apps can feel “almost native” but not fully

---

### A6. Rewrite front-end in React Native / Expo

**Idea:** Port UI to RN; reuse TypeScript types and logic from `lib/store.ts`, `stone-paths.ts`.

**Pros:** Real mobile layout, keyboard avoiding views, eventual Android  
**Cons:** Rebuild all gestures (hold-to-complete, drag), SVG stones, animations; two codebases unless you monorepo  
**Effort:** ~4–8 weeks for parity  
**Risk:** High for a side project unless iOS app is the long-term home

---

## 5. Path B — iOS native app

True native gives the best keyboard and gesture story. Options depend on how much you want to reuse vs rewrite.

### B1. SwiftUI app (greenfield native)

**Idea:** Rebuild Endless Tower in SwiftUI. Stones as `Path` + `Canvas` or SVG via `Shape`. State in SwiftData or UserDefaults. Same visual rules (hash → shape/color, bottom-anchored stack).

**Pros**
- `safeAreaInset`, `@FocusState`, keyboard avoidance built-in
- Haptics (hold-to-complete), drag reorder, spring animations feel native
- Best long-term home for a *personal, tactile* product
- No browser viewport hacks

**Cons**
- Full rewrite of UI + interactions
- No shared React components
- You maintain Swift + optional web fork

**Effort:** ~6–10 weeks to match current feature set (tower, archive, save, detail, animations)  
**Risk:** Medium — scope creep if feature parity is the bar

**Good fit if:** iOS is the primary destination and you care about polish over speed.

---

### B2. SwiftUI shell + shared logic (pragmatic native)

**Idea:** Same as B1, but explicitly *don’t* port every web feature on day one. Ship MVP:

- Stack / add / complete / local persistence
- Archive as simple list first, mini-towers later

**Pros:** Faster time-to-native-feel; validates product on device  
**Cons:** Feature gap vs web temporarily  
**Effort:** ~3–4 weeks MVP  
**Risk:** Lower

---

### B3. Capacitor (see A5)

Counted under web for code reuse, but distribution is native App Store. Middle ground.

---

### B4. React Native / Expo (see A6)

Native UI toolkit, JavaScript codebase. Better keyboard APIs than web, worse than SwiftUI for platform feel.

---

## 6. Comparison matrix

| Option | Tower stable while typing | Native feel | Reuse current code | Time to ship | App Store |
|--------|---------------------------|-------------|--------------------|--------------|-----------|
| **A1** Keyboard-stable shell | Partial | ★★☆ | ★★★★★ | Days | No (URL) |
| **A2** Naming sheet (web) | **Yes** | ★★★★ | ★★★★ | ~1 week | No |
| **A3** Modal-only entry | Yes | ★★★ | ★★★★★ | Days | No |
| **A4** PWA install | No alone | ★★★ | ★★★★★ | Days | No |
| **A5** Capacitor | Yes (with plugin) | ★★★ | ★★★★★ | ~2 weeks | Yes |
| **A6** React Native | Yes | ★★★★ | ★★★ (logic only) | Weeks | Yes |
| **B1** SwiftUI full | **Yes** | ★★★★★ | ★ (spec only) | Months | Yes |
| **B2** SwiftUI MVP | **Yes** | ★★★★★ | ★ | ~1 month | Yes |

---

## 7. Recommendation (phased)

Assumption: you want relief *soon* without abandoning the working web app, and you’ll decide on App Store later based on how much you use it daily.

### Phase 1 — Web UX fix (do this first)

Implement **A2: composition / naming sheet**.

- Highest impact on the clunky feeling
- Aligns with existing fade-when-focused patterns (expanded stone already dims the stack)
- One interaction model for add, edit, and save
- Optional **A1** as a belt-and-suspenders layer if any residual jump remains

Add **A4 PWA** when Phase 1 feels good — better icon-on-home-screen experience, same codebase.

### Phase 2 — Decide native (4–6 weeks of daily use later)

Use the app on your phone for a few weeks after Phase 1.

| If… | Then… |
|-----|--------|
| Web + naming sheet feels good enough | Stay web; iterate on polish (haptics via Vibration API is weak on iOS anyway) |
| You want App Store + icon + offline | **A5 Capacitor** — lowest cost native packaging |
| You want best-in-class tactile feel | **B2 SwiftUI MVP** — treat web as prototype / companion |

### Phase 3 — Only if Endless Tower becomes a “real” product

**B1 SwiftUI full parity**, CloudKit sync, widgets, Shortcuts. Not needed for a personal side project unless intent changes.

---

## 8. What we would *not* recommend

1. **PWA alone** — installs nicely but won’t fix keyboard jump.
2. **More `dvh` / viewport meta tweaks alone** — treats symptom; iOS will keep resizing.
3. **Inline `<input>` on the stone SVG** — mid-stack focus is the worst case for mobile browsers; even with A1, editing a stone high in the tower fights scroll.
4. **Full SwiftUI rewrite before trying A2** — expensive before validating that stable typing fixes the feel.

---

## 9. Open decisions for you

Before implementation, pick one line on each:

1. **Editing metaphor**
   - *A)* Text stays visually on the stone while typing (hard on web)
   - *B)* Stone dims; name typed in a keyboard-attached bar (**recommended**)

2. **Distribution target**
   - *A)* Mobile web URL only
   - *B)* Home-screen PWA
   - *C)* App Store within 3 months

3. **Investment ceiling**
   - *A)* ~1 week (web only)
   - *B)* ~1 month (Capacitor or SwiftUI MVP)
   - *C)* Multi-month native rewrite

4. **Android**
   - If yes → lean Capacitor or React Native later
   - If iPhone-only → SwiftUI becomes more attractive long-term

---

## 10. Next artifact (if you approve Phase 1)

A short implementation spec: **“Composition mode”** with:

- States: `idle | naming (add) | naming (edit) | naming (save)`
- Layout: frozen tower layer + keyboard-linked input layer
- `visualViewport` hook API
- Acceptance criteria (no tower movement on focus/blur; 60fps fade; VoiceOver labels)
- Explicit non-goals (no change to hold-to-complete, drag, or archive)

---

## References

- Current shell: `app/app/page.tsx` (`h-dvh`)
- Add input: `app/components/add-stone-button.tsx`
- Inline edit: `app/components/stone.tsx`
- Related enhancement spec: `docs/SPEC-enhancements.md` (item 2: richer detail / edit)
