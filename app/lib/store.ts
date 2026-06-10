// Simple client-side state management for the Endless Tower app
// Uses a custom hook pattern with React state

export interface Task {
  id: string
  text: string
  createdAt: number
  completedAt?: number
  priority: "low" | "medium" | "high"
}

export interface CompletedSession {
  id: string
  tasks: Task[]
  completedAt: number
  name?: string
}

export function saveTower(tasks: Task[], name: string): CompletedSession {
  return {
    id: generateId(),
    tasks,
    completedAt: Date.now(),
    name,
  }
}

export type AppScreen = "loading" | "onboarding" | "main" | "archive"

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
}

const STORAGE_KEY = "endless-tower-data"
const ONBOARDING_KEY = "endless-tower-onboarded"

export interface AppState {
  tasks: Task[]
  sessions: CompletedSession[]
  sunk: Task[]
  hasOnboarded: boolean
}

export function loadState(): AppState {
  if (typeof window === "undefined") {
    return { tasks: [], sessions: [], sunk: [], hasOnboarded: false }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      return {
        tasks: data.tasks || [],
        sessions: data.sessions || [],
        sunk: data.sunk || [],
        hasOnboarded: localStorage.getItem(ONBOARDING_KEY) === "true",
      }
    }
  } catch {
    // ignore
  }
  return { tasks: [], sessions: [], sunk: [], hasOnboarded: false }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ tasks: state.tasks, sessions: state.sessions, sunk: state.sunk })
    )
    if (state.hasOnboarded) {
      localStorage.setItem(ONBOARDING_KEY, "true")
    }
  } catch {
    // ignore
  }
}
