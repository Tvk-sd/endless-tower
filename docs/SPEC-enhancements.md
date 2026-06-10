# Endless Tower — Enhancement Spec

**Status:** Draft for review · **Author:** UX/PM review session, Jun 10 2026
**Source:** Design review of `main` @ `557921b` (live app + codebase audit)

Ordered by the agreed priority. Each item has a problem statement, the decided
behavior, and checkable acceptance criteria (AC). Out-of-scope notes prevent
scope creep.

---

## 1. Unify the archive model

**Problem.** `sessions` mixes two concepts: auto-created daily completion logs
(written silently by `completeTask`) and manually saved towers. Users see
archive entries they never created.

**Decision.** The *saved tower* is the only archive unit. Completing a stone
never creates an archive entry; completions live in the current tower until
the user saves it.

**Changes.**
- Remove the session-creation block from `completeTask` in `main-screen.tsx`.
- `sessions` now only ever contains entries created via the Save dialog.
- Migration: on load, existing unnamed auto-sessions are kept (don't delete
  user data) but no new ones are created.

**Acceptance criteria.**
- [ ] AC1: Completing a stone does not change the Towers archive.
- [ ] AC2: "Save & Keep Building" and "Save & Start New Tower" are the only
  paths that add an archive entry.
- [ ] AC3: Existing localStorage data loads without error; previously
  auto-created sessions remain visible.
- [ ] AC4: The "Towers" link only appears when at least one saved tower exists.

---

## 2. Richer stone detail view

**Problem.** Tapping a stone fades the entire tower to reveal only "Delete" —
a high-drama transition with a low-value, destructive-first payoff.

**Decision.** The detail panel shows, top to bottom:
1. Age line — "placed today" / "placed 3 days ago" (app vocabulary, 11px).
2. **Edit** — tap to edit the task text inline (same input style as
   `add-stone-button.tsx`; Enter saves, Escape cancels).
3. **Delete** — demoted: 11px, 40% opacity, below Edit.

**Acceptance criteria.**
- [ ] AC1: Expanded stone shows age, Edit, Delete in that order.
- [ ] AC2: Editing preserves the stone's id (shape/color/rotation unchanged).
- [ ] AC3: Empty edit text is rejected (no empty stones).
- [ ] AC4: Delete is visually subordinate to Edit (size and/or opacity).
- [ ] AC5: All text follows the 11px / 0.04em nav type system.

---

## 3. Undo for destructive actions

**Problem.** Delete is one tap and irreversible; complete is irreversible.
No forgiveness contradicts the app's calm personality.

**Decision.** After a delete or complete, a quiet "undo" text button fades in
above the + button for 5 seconds. Tapping it restores the previous state
(stone back in position, completion reverted). No toast library — plain text
in the existing type system.

**Acceptance criteria.**
- [ ] AC1: "undo" appears within 200ms of a delete or complete and fades out
  after ~5s.
- [ ] AC2: Undo after delete restores the stone at its original index.
- [ ] AC3: Undo after complete reverts `completedAt` (stone returns to
  outline state).
- [ ] AC4: A new destructive action replaces the previous undo window
  (single-level undo only).
- [ ] AC5: Undo is keyboard-focusable.

---

## 4. Remove the priority field

**Problem.** `priority` exists in the data model but has no UI and no effect.
Drag-order already expresses priority. Two systems would compete.

**Decision.** Kill the field. Stack position is the only priority. Onboarding
copy "Drag to reprioritise" stays — it's now literally true.

**Acceptance criteria.**
- [ ] AC1: `priority` removed from the `Task` type and all call sites
  (`updatePriority`, `onSetPriority`, dead props in `stone-detail.tsx`).
- [ ] AC2: Loading old localStorage data with priority fields doesn't error
  (extra fields ignored).
- [ ] AC3: `npx tsc --noEmit` passes.

---

## 5. Tactile feedback bundle

**Problem.** A touch-first app with no haptic, sonic, or press feedback.

**Decision.** Three small additions:
- **Haptics:** `navigator.vibrate(10)` on stone drop; `vibrate(20)` on
  completion. Silently no-ops where unsupported (iOS Safari).
- **Press-compress:** stones scale to ~0.97 on pointer-down, spring back on
  release — signals "keep holding" for the hold gesture.
- **Land-sway:** when a new stone lands, the tower sways once (reuse the
  disabled `ENABLE_SWING` math) and settles within ~1.5s. No idle motion.

**Acceptance criteria.**
- [ ] AC1: No errors on browsers without `navigator.vibrate`.
- [ ] AC2: Press-compress is visible on pointer-down and reverses on release,
  cancel, and leave.
- [ ] AC3: Sway triggers only on stone landing, settles ≤1.5s, never loops.
- [ ] AC4: Hold-to-complete timing (300ms detect, 1200ms fill) is unchanged.

---

## 6. Sinking stones (prototype first — this branch)

**Problem.** Completed stones occupy the tower forever; the only purge is
"Save & Start New Tower." Daily use silts up with green stones.

**Hypothesis.** Completed stones should *sink into the ground* after a grace
period, keeping the tower alive without manual cleanup, and creating a daily
rhythm. Sunk stones remain counted (they're in the tower's history) but leave
the visible stack.

**Prototype behavior (accelerated for testing).**
- A completed stone stays in the stack for a grace period
  (**prototype: 15s; production target: until next app open or 24h**).
- It then animates: sinks downward past the bottom of the tower while fading,
  over ~1.2s with an ease-in curve (heavy object settling into ground).
- Stones above it settle down into the gap (existing `top` transition).
- A faint ground counter appears near the + button: "N stones rest below" —
  tapping it is a no-op in the prototype.
- Sunk stones are moved from `tasks` to a `sunk: Task[]` list in state and
  persisted; Save Tower includes sunk stones in the saved session.

**Acceptance criteria (prototype).**
- [ ] AC1: A completed stone sinks automatically after the grace period
  without user input.
- [ ] AC2: The sink animation moves the stone downward and fades it; stones
  above settle smoothly into the gap.
- [ ] AC3: The ground counter increments per sunk stone and persists across
  reloads.
- [ ] AC4: Saving a tower includes sunk stones in the session's task list and
  resets the ground counter when "Start New Tower" is chosen.
- [ ] AC5: Undoing a completion during the grace period cancels the pending
  sink (once item 3 lands; for the prototype, completing → grace → sink is
  one-way).
- [ ] AC6: `npx tsc --noEmit` passes.

**Validation questions for the prototype.**
1. Does watching a stone sink feel rewarding or like loss?
2. Is the grace period the right mechanism, or should sinking happen on next
   app open ("overnight")?
3. Does the ground counter give enough sense of accumulated progress?

**Out of scope.** Tapping the ground to view sunk stones; configurable grace
period; sink sound.

---

## 7. Polish bundle

**Changes.**
- **Desktop frame:** center the phone frame vertically; soft wide shadow
  beneath it so it reads as an object on a surface.
- **Empty state:** replace "No stones yet" with a faint ground line and
  "Place your first stone."
- **Save dialog → bottom sheet:** same content, rises from the bottom edge,
  consistent with the ground/stone metaphor.

**Acceptance criteria.**
- [ ] AC1: On ≥ sm viewports the frame is vertically centered with a visible
  soft shadow; on mobile nothing changes (full-bleed).
- [ ] AC2: Empty state shows the new copy and ground line at ≤30% opacity.
- [ ] AC3: Save sheet animates from the bottom, traps focus, and dismisses on
  backdrop tap and Escape.

---

## Sequencing note

Items 2–4 are independent and low-risk — any order. Item 1 changes data flow
and should land before item 6 ships beyond prototype (both touch
`completeTask`). Item 6 is validated on this branch (`prototype/sinking-stones`)
before being committed to the roadmap.
