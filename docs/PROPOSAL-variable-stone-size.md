# Endless Tower — Variable Stone Size (Proposal)

**Status:** Approved for implementation · **Date:** Jun 10 2026  
**Author:** PM/dev handoff  
**Goal:** Stones visually reflect how much text they carry — longer tasks feel heavier/larger without breaking the tactile tower metaphor.

**Locked decisions:**
- **Proportional hug** — width and height scale together (same factor; no stretch).
- **Default as minimum** — short text stays at current size (`160×208` @ scale 1); stones never shrink below default.
- **True hug** — measured text drives scale **up** when content needs more room.
- **At max size** — font shrinks before any truncation (no ellipsis in v1).
- **Tower updates on save** — composition overlay may preview live; stack reflows on Add/Done only.

---

## 1. Problem & opportunity

Today every stone is the same size (`160×208px` at scale 1), regardless of text. Short tasks like “Milk” and long ones like “Finish Q3 roadmap review with design” occupy identical silhouettes. Text wraps inside a fixed box; the physical metaphor is slightly dishonest.

**Opportunity:** A pebble with more written on it could read as a *bigger* stone — intuitive, organic, aligned with “tasks as objects.” Done well, it adds character without turning the tower into a chart.

**Risk if done poorly:** Uneven stacks look messy; tower height becomes unpredictable; editing text causes jarring jumps; archive mini-towers and drop animations break.

---

## 2. Design principles

| Principle | Decision |
|-----------|----------|
| **Default as minimum** | `160×208` @ scale 1 is the floor. “Milk” stays current size — never smaller. |
| **True hug (grow only)** | Measure text; if it needs more room than default, scale **up** proportionally. |
| **Proportional scale** | One scale factor applied to both width and height. Shape stays organic — no independent stretch. |
| **Size changes on save** | Composition overlay previews live while typing; tower reflows on Add/Done only. |
| **Subtle range** | Target roughly **1.0×–1.35×** scale at first. Tower should still feel like *a tower*, not a skyline. |
| **Hard max** | Cap scale (e.g. 1.35× → ~216×280px @ scale 1). At cap, **shrink font** (13 → 12 → 11px) and re-measure. |
| **Id → shape/color unchanged** | Size comes from `text`, not `id`. Shape, color, rotation stay deterministic per task. |
| **Animate size changes** | 300–350ms ease when edit changes stone size (same family as expand/collapse). |

**Max-length behavior (decided):** Font shrinks at cap. No ellipsis in v1.

---

## 3. Sizing model

### Primary model — measured text + proportional scale

```
1. Measure text block at base font (13px) within max text width (~138px @ scale 1)
2. Add padding → required content box (e.g. +48px vertical, +40px horizontal in stone space)
3. scaleFactor = max(
     requiredW / STONE_W,
     requiredH / STONE_H,
     1.0                    ← default as minimum; never scale down
   )
4. Clamp scaleFactor to MAX_SCALE (e.g. 1.35)
5. If still overflow at cap → step font down (12px, then 11px), re-measure from step 1
6. Final dimensions:
     width  = STONE_W × scaleFactor × viewportScale
     height = STONE_H × scaleFactor × viewportScale
```

**Why not line tiers alone:** Tiers feel chunky and don’t “hug.” Measurement + proportional scale gives true hug while staying predictable.

**Why not independent W/H:** Stretching the SVG path looks like rubber, not stone.

### Fallback tiers (archive mini-towers only)

At very small render sizes (24–40px in archive grid), full measurement may be overkill. Use **2–3 size buckets** derived from the same scale factor for readability.

---

## 4. Impact on the codebase

| Area | Today | With variable size |
|------|--------|---------------------|
| `tower-layout.ts` | Fixed `STONE_STEP` for all stones | Per-stone dimensions + **pairwise overlap** via `getStackOverlap()` |
| `getTowerHeight()` | `count × STEP` | Sum of each stone’s `(height − overlapWithStoneBelow)` |
| `main-screen.tsx` stack | `topPos = PAD_TOP + i * STEP` | Cumulative Y from layout array |
| `stone.tsx` | Fixed `STONE_W` / `STONE_H` | Accept `width` + `height` (proportional pair) |
| Drop animation | Fixed fall distance | Use layout slot height for `--fall-from` |
| Composition overlay | Fixed expanded stone | **Live preview** — stone grows while typing |
| Archive mini-towers | Uniform decorative scale | Bucketed sizes from same scale factor |
| Drag reorder | Fixed 14px shift hint | OK unchanged |

**Existing asset:** `getStackOverlap()` in `stone-paths.ts` — shape-aware, height-aware; imported but not yet wired.

**New risk:** `getStoneTransform()` adds ±10px offsetX and ±8° rotation. Wide stones may clip on 390px frame. Enforce **max stone width** (~240px normal, ~280px composition/expanded).

---

## 5. Proposed architecture

### 5.1 New module: `lib/stone-size.ts`

```ts
export interface StoneDimensions {
  width: number
  height: number
  scaleFactor: number   // 1.0 = default; never < 1.0
  fontSize: number
  lineCount: number
}

export function getStoneDimensions(
  text: string,
  options?: { scale?: number; expanded?: boolean }
): StoneDimensions
```

Internals:
- Off-screen measure (canvas or hidden div) at known max text width
- Proportional scale from content box, floored at 1.0
- Font step-down loop when content exceeds max scale
- Expanded/composition mode may use higher max width cap

### 5.2 Extended module: `lib/tower-layout.ts`

```ts
export interface StackSlot {
  taskId: string
  top: number
  width: number
  height: number
  overlap: number
}

export function computeStackLayout(
  tasks: Task[],
  viewportScale: number,
  getDimensions: (text: string) => StoneDimensions
): { slots: StackSlot[]; towerHeight: number }
```

For each stone pair `(above, below)`:
- `overlap = getStackOverlap(shapeAbove, shapeBelow, heightAbove)`
- `top[i+1] = top[i] + height[i] - overlap`

### 5.3 `Stone` component

- Accept optional `width` + `height` (default to `STONE_W` / `STONE_H`)
- SVG uses both dimensions; viewBox stays `0 0 200 260` — **uniform scale** of path
- Text `maxWidth` derived from `width - padding`
- Pass explicit `fontSize` from `getStoneDimensions`

### 5.4 When size updates

| Event | Behavior |
|-------|----------|
| Add stone | Size from submitted text; fall animation into computed slot |
| Edit (composition Done) | Recalculate layout; animate size + neighbor positions |
| Complete / delete | Recalculate layout; animate |
| Load from localStorage | Compute on load (no persisted size field) |
| Composition typing | Live preview on overlay stone only; tower stays frozen |

**No schema change** — size always derived from `text` + layout rules.

---

## 6. UX flows

### Add (composition mode)

1. Tap **+** → tower dims, default-size stone appears  
2. User types → **stone grows proportionally in overlay** (live preview)  
3. At long text → font steps down inside growing stone  
4. **Add** → overlay closes → stone drops into correctly sized slot  

### Edit

1. Composition opens with stone at current measured size  
2. Live preview while typing  
3. **Done** → tower reflows with animation  

### Edge cases

| Case | Behavior |
|------|----------|
| Very long text | Hit max scale; font 12 → 11px; no ellipsis in v1 |
| Short / single word | Stays at default minimum (160×208) |
| Single long word | `word-break: break-word` (already in place) |
| Empty text | Rejected (existing rule) |
| Wide stone + rotation | Clamp width; verify no horizontal clip on 390px frame |

---

## 7. Visual mock (conceptual)

```
Today (uniform):          Proportional hug (v1):

    ┌──────┐                  ┌──────┐
    │ Milk │                  │ Milk │  ← 1.0× (minimum = default)
    ├──────┤                  ├──────────┤
    │ Call │                  │ Call mom │  ← ~1.1× W+H together
    │ mom  │                  │ about appt │
    ├──────┤                  ├──────────────┤
    │ Q3   │                  │ Finish Q3    │  ← ~1.25×, smaller font
    │ road-│                  │ roadmap rev. │
    │ map  │                  └──────────────┘
    └──────┘
```

Overlap keeps outlines **touching** — `getStackOverlap()` per pair.

---

## 8. Implementation phases

### Phase 0 — Spike (1–2 days)

**Branch:** `prototype/variable-stone-height`

- [ ] Implement `getStoneDimensions()` with measure + proportional scale (min 1.0, max ~1.35)
- [ ] Wire `computeStackLayout()` in isolation (Storybook or static page)
- [ ] Stack 5–6 real task strings; compare to `Research images/Stones.png`
- [ ] Check widest stone + max rotation on 390px — no clip
- [ ] **Go/no-go:** Do proportionally larger stones still feel like one tower?

### Phase 1 — Core layout (2–3 days)

- [ ] `stone-size.ts` + `computeStackLayout()`
- [ ] Refactor `main-screen.tsx` to use `slots[]` instead of `i * STEP`
- [ ] `Stone` accepts dynamic `width` + `height`
- [ ] Update drop animation `--fall-from` from layout slot

### Phase 2 — Edit, animation & composition preview (1–2 days)

- [ ] Recalculate layout on text edit (composition Done)
- [ ] CSS transition on `top` + `width` + `height`
- [ ] Composition overlay: **live proportional preview while typing**

### Phase 3 — Surfaces parity (1 day)

- [ ] `tower-detail-screen.tsx`
- [ ] `archive-screen.tsx` mini-towers (bucketed sizes from scale factor)
- [ ] Onboarding/loading decorative stones: fixed size OK

### Phase 4 — Polish & QA (1 day)

- [ ] Mobile: 20-stone tower scroll performance
- [ ] Drag reorder with variable sizes
- [ ] Widest stone + offset/rotation clip test
- [ ] Typecheck + manual device pass

**Total estimate:** ~6–9 days for web v1

---

## 9. Acceptance criteria (v1)

- [ ] AC1: Stone size derives from measured text, not character-count guesswork.
- [ ] AC2: **Default is minimum** — short text never renders smaller than 160×208 @ scale 1.
- [ ] AC3: Width and height scale **proportionally** from one factor (no stretch).
- [ ] AC4: Min/max enforced; no horizontal clip on 390px frame (including rotation/offset).
- [ ] AC5: Stack overlap keeps stone outlines touching (no visible gaps).
- [ ] AC6: At max size, font shrinks before text is truncated; no ellipsis in v1.
- [ ] AC7: Editing text and saving changes stone size with smooth animation; shape/color/id unchanged.
- [ ] AC8: Adding a stone uses correct slot size before drop animation runs.
- [ ] AC9: Composition overlay preview matches final tower stone size after Add/Done.
- [ ] AC10: Archive mini-towers reflect relative size differences (bucketed OK).
- [ ] AC11: No localStorage migration — existing tasks sized on load from current text.

---

## 10. SwiftUI note (App Store path)

Same model ports cleanly:

- `StoneDimensions` → Swift struct with `scaleFactor` (≥ 1.0)
- Line measurement → `Text` in fixed-width container + `GeometryReader`
- Layout → cumulative Y array (same algorithm as web)
- Overlap → scale `topY`/`bottomY` from shape assets

**Do not persist stone size** — derive from text in both web and SwiftUI.

---

## 11. Alternatives considered

| Alternative | Why not (for now) |
|-------------|-------------------|
| **Independent W/H stretch** | Looks like rubber, not stone; rejected |
| **Scale below 1.0 (shrink short tasks)** | Breaks visual anchor; default-as-minimum instead |
| Line tiers only | Doesn’t true-hug; measurement is better |
| Size from **priority** field | Priority being removed from product |
| Size from **age** | Interesting v2 — separate feature |
| Font only, fixed stone | Weaker metaphor |
| Live resize in tower (not overlay) | Keyboard + reflow = clunky (learned from composition mode) |
| Ellipsis at max | Rejected for v1; font shrink instead |

---

## 12. Constants to tune in Phase 0 spike

| Constant | Starting value | Notes |
|----------|----------------|-------|
| `MIN_SCALE` | `1.0` | Default size is floor |
| `MAX_SCALE` | `1.35` | ~216×280px @ scale 1 |
| Base font | `13px` | Match current stack text |
| Font steps at cap | `12px`, `11px` | Re-measure after each step |
| Max text width | `138px` | ~`STONE_W - 22` padding |
| Composition max width | `~280px` | Expanded overlay cap |

Adjust after spike on phone.

---

## 13. Next step

Phase 0 spike on branch `prototype/variable-stone-height`.

---

## References

- Fixed layout constants: `app/lib/tower-layout.ts`
- Overlap math: `app/lib/stone-paths.ts` → `getStackOverlap()`
- Stone render: `app/components/stone.tsx`
- Stack positioning: `app/components/main-screen.tsx`
- Composition overlay: `app/components/composition-overlay.tsx`
