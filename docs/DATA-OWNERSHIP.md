# Data ownership

How state is stored, who owns it at runtime, and what gets persisted in Endless Tower.

There is no backend. All durable data lives in the browser's `localStorage`, accessed through `app/lib/store.ts`.

---

## Persistence layer (`lib/store.ts`)

### localStorage keys

| Key | Contents |
|-----|----------|
| `endless-tower-data` | JSON: `{ tasks, sessions }` |
| `endless-tower-onboarded` | `"true"` after first-run onboarding |

### Data types

**Task** — a stone on the active tower:

- `id`, `text`, `createdAt`, `priority` (`low` \| `medium` \| `high`)
- `completedAt?` — set on hold-to-complete; stone stays in the stack with a colored fill

**CompletedSession** — an archive entry:

- `id`, `tasks[]`, `completedAt`
- `name?` — set when the user explicitly saves a tower

**AppState** — the shape used for load/save:

```ts
{ tasks: Task[]; sessions: CompletedSession[]; hasOnboarded: boolean }
```

### API

| Function | Role |
|----------|------|
| `loadState()` | Read from `localStorage`, apply migrations, return `AppState` |
| `saveState(state)` | Write `tasks` + `sessions` to `endless-tower-data`; write onboarding flag when `hasOnboarded` is true |
| `saveTower(tasks, name)` | Build a named `CompletedSession` object (does not persist by itself) |
| `generateId()` | Create a unique task/session id |

### Load behavior

- **SSR / no `window`**: returns empty state; `saveState` is a no-op.
- **Migration**: legacy `sunk` stones from an old prototype are merged into `tasks` on load.
- **Cleanup**: duplicate tasks inside saved sessions are deduped (fixes a former StrictMode double-write bug).
- **Errors**: corrupt or missing JSON falls back to empty state without throwing.

`hasOnboarded` is stored in a separate key, not inside the main JSON blob.

---

## Runtime ownership

```text
localStorage
    ↑ saveState (on change)
    │
lib/store.ts  ←── loadState (once on mount)
    ↑
page.tsx  ──initial props──→  MainScreen
```

### `page.tsx` — bootstrap and routing

Owns:

- `screen` — which view to show (`loading` \| `onboarding` \| `main`); **not persisted**
- `appState` — loaded once on mount via `loadState()`

Responsibilities:

1. On mount: `loadState()` → `setAppState`
2. After loading animation: route to `main` or `onboarding` based on `hasOnboarded`
3. On onboarding complete: set `hasOnboarded: true`, call `saveState`, switch to `main`
4. Pass `initialTasks`, `initialSessions`, and `hasOnboarded` into `MainScreen`

Does **not** re-read `appState` after the first load. Does **not** mutate `tasks` or `sessions`.

### `MainScreen` — live source of truth

Owns:

- `tasks` — active tower (`useState`, seeded from `initialTasks`)
- `sessions` — archive (`useState`, seeded from `initialSessions`)
- All task/session mutations (add, edit, complete, reorder, save tower, add to session)

Persistence:

```ts
useEffect(() => {
  saveState({ tasks, sessions, hasOnboarded })
}, [tasks, sessions, hasOnboarded])
```

Every change to `tasks` or `sessions` triggers an immediate write-through to `localStorage`. `hasOnboarded` is passed through as a prop and included in saves but is never mutated here.

### `lib/store.ts` — persistence only

No React state. No UI logic. Serializes and deserializes `AppState` plus small helpers.

---

## What is persisted vs ephemeral

### Persisted

| Data | When it changes |
|------|-----------------|
| `tasks` | Add, edit, complete, reorder, delete stone; save tower with "start fresh" |
| `sessions` | Hold-to-complete (daily grouping); explicit "Save Tower"; add stone inside a saved session |
| `hasOnboarded` | User finishes onboarding (`page.tsx` only) |

### Ephemeral (lost on refresh)

- Expanded stone, drag state, completion animation progress
- Archive overlay open/closed, selected session, save dialog
- Screen routing during a session (re-derived from `hasOnboarded` on load)
- `newStoneId`, fall animation, composition overlay mode

---

## Session semantics

`sessions` serves two purposes:

1. **Daily auto-sessions** — when a stone is completed, it is appended to today's session (matched by calendar date). A new session is created if none exists for today. Duplicate task ids within a session are skipped.

2. **Named saved towers** — when the user saves the current tower, `saveTower()` creates a new session with a `name` and the full current `tasks` array. Optionally clears `tasks` if the user chooses to start fresh.

Both kinds live in the same `sessions` array in storage.

---

## Write paths

| User action | Owner | Storage effect |
|-------------|-------|----------------|
| Finish onboarding | `page.tsx` | `hasOnboarded` → `endless-tower-onboarded` |
| Add / edit / delete / reorder stone | `MainScreen` | `tasks` updated |
| Hold-to-complete | `MainScreen` | `tasks` + today's `sessions` entry |
| Save Tower | `MainScreen` | New named session; optional `tasks` clear |
| Add stone in tower detail | `MainScreen` | `sessions` entry updated |

---

## Known architectural tension

`page.tsx` holds `appState` in React state, but only `MainScreen` mutates `tasks` and `sessions` after mount. The parent's `appState` can drift from what `MainScreen` has in memory. This is harmless today because `page.tsx` never reads `appState` again after the initial load — but it is a split ownership model worth resolving if storage is refactored (e.g. single owner, custom hook, or context).

---

## Scope limits

- Per-browser, per-device — no sync, accounts, or cloud backup
- No schema versioning field in storage; migrations are inline in `loadState()`
- Quota errors are swallowed (`saveState` catch block); data loss is possible under storage pressure
