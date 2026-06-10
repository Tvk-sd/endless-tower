"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Stone, EXPANDED_W } from "./stone"
import { AddStoneButton } from "./add-stone-button"
import { StoneDetail } from "./stone-detail"
import { ArchiveScreen } from "./archive-screen"
import type { Task, CompletedSession } from "@/lib/store"
import { generateId, saveState, saveTower } from "@/lib/store"
import { SaveTowerDialog } from "./save-tower-dialog"
import { getStoneShapeByHash, getStackOverlap, hashString } from "@/lib/stone-paths"

interface MainScreenProps {
  initialTasks: Task[]
  initialSessions: CompletedSession[]
  hasOnboarded: boolean
}

const ENABLE_SWING = false

export function MainScreen({ initialTasks, initialSessions, hasOnboarded }: MainScreenProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [sessions, setSessions] = useState<CompletedSession[]>(initialSessions)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [completionProgress, setCompletionProgress] = useState(0)
  const [showArchive, setShowArchive] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [newStoneId, setNewStoneId] = useState<string | null>(null)

  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const holdDetectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pointerDownTimeRef = useRef<number>(0)
  const holdActiveRef = useRef<boolean>(false)
  const stackRef = useRef<HTMLDivElement>(null)
  const prevTaskCountRef = useRef<number>(initialTasks.length)
  const towerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    saveState({ tasks, sessions, hasOnboarded })
  }, [tasks, sessions, hasOnboarded])

  // Forward native wheel events to the scroll container
  useEffect(() => {
    const el = stackRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      el.scrollTop += e.deltaY
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [])

  // Swing animation — pendulum sway, amplitude + period scale with stone count
  useEffect(() => {
    const el = towerRef.current
    if (!el || !ENABLE_SWING || tasks.length === 0) {
      if (el) el.style.transform = ""
      return
    }
    const amplitude = Math.min(tasks.length * 0.35, 3.5)
    const period = (3.5 + tasks.length * 0.3) * 1000
    let rafId: number
    const animate = (ts: number) => {
      el.style.transform = `rotate(${amplitude * Math.sin((ts / period) * 2 * Math.PI)}deg)`
      rafId = requestAnimationFrame(animate)
    }
    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [tasks.length])

  // Scroll to bottom when a new stone is added
  useEffect(() => {
    if (tasks.length > prevTaskCountRef.current && stackRef.current) {
      // Small delay to let the DOM update with new height first
      requestAnimationFrame(() => {
        if (stackRef.current) stackRef.current.scrollTop = stackRef.current.scrollHeight
      })
    }
    prevTaskCountRef.current = tasks.length
  }, [tasks.length])

  const addTask = useCallback((text: string) => {
    const newTask: Task = {
      id: generateId(),
      text,
      createdAt: Date.now(),
      priority: "medium",
    }
    setTasks((prev) => [...prev, newTask])
    setNewStoneId(newTask.id)
    setTimeout(() => setNewStoneId(null), 900)
  }, [])

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    setExpandedId(null)
  }, [])

  const updatePriority = useCallback((id: string, priority: Task["priority"]) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, priority } : t))
    )
  }, [])

  // Mark a task as completed -- it stays in the stack with colored fill
  const completeTask = useCallback((id: string) => {
    const completedAt = Date.now()
    const task = tasks.find((t) => t.id === id)
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completedAt } : t))
    )
    // Add to today's session for archive tracking.
    // Kept outside the setTasks updater (updaters must be side-effect free —
    // StrictMode double-invokes them, which previously duplicated entries).
    if (task) {
      const completed = { ...task, completedAt }
      setSessions((prevSessions) => {
        const today = new Date().toDateString()
        const existing = prevSessions.find(
          (s) => new Date(s.completedAt).toDateString() === today
        )
        if (existing) {
          if (existing.tasks.some((t) => t.id === completed.id)) {
            return prevSessions
          }
          return prevSessions.map((s) =>
            s.id === existing.id
              ? { ...s, tasks: [...s.tasks, completed] }
              : s
          )
        }
        return [
          ...prevSessions,
          { id: generateId(), tasks: [completed], completedAt },
        ]
      })
    }
    setCompletingId(null)
    setCompletionProgress(0)
    holdActiveRef.current = false
  }, [tasks])

  const handleSave = useCallback((name: string, startFresh: boolean) => {
    setSessions((prev) => [...prev, saveTower(tasks, name)])
    if (startFresh) setTasks([])
    setShowSaveDialog(false)
  }, [tasks])

  const clearAllTimers = useCallback(() => {
    if (holdDetectRef.current) {
      clearTimeout(holdDetectRef.current)
      holdDetectRef.current = null
    }
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }, [])

  const handlePointerDown = useCallback(
    (id: string, isCompleted: boolean) => {
      if (expandedId) {
        // Still record time so handlePointerUp can detect a tap-to-close
        pointerDownTimeRef.current = Date.now()
        return
      }
      clearAllTimers()
      pointerDownTimeRef.current = Date.now()
      holdActiveRef.current = false

      // Only start hold-to-complete for non-completed stones
      if (!isCompleted) {
        holdDetectRef.current = setTimeout(() => {
          holdDetectRef.current = null
          holdActiveRef.current = true
          setCompletingId(id)
          setCompletionProgress(0)
          const startTime = Date.now()

          holdTimerRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime
            const progress = Math.min((elapsed / 1200) * 100, 100)
            setCompletionProgress(progress)

            if (progress >= 100) {
              if (holdTimerRef.current) {
                clearInterval(holdTimerRef.current)
                holdTimerRef.current = null
              }
              completeTask(id)
            }
          }, 16)
        }, 300)
      }
    },
    [expandedId, completeTask, clearAllTimers]
  )

  const handlePointerUp = useCallback(
    (id: string) => {
      const duration = Date.now() - pointerDownTimeRef.current
      clearAllTimers()

      if (!holdActiveRef.current && duration < 300) {
        // Short tap -- toggle expand for any stone (completed or not)
        if (completingId) return
        setExpandedId((prev) => (prev === id ? null : id))
      }

      if (holdActiveRef.current && completionProgress < 100) {
        // Hold released early -- cancel
        setCompletingId(null)
        setCompletionProgress(0)
      }

      holdActiveRef.current = false
    },
    [completingId, completionProgress, clearAllTimers]
  )

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index)
    setExpandedId(null)
  }, [])

  const handleDragOver = useCallback((index: number) => {
    setDragOverIndex(index)
  }, [])

  const handleDragEnd = useCallback(() => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      setTasks((prev) => {
        const newTasks = [...prev]
        const [movedTask] = newTasks.splice(dragIndex, 1)
        newTasks.splice(dragOverIndex, 0, movedTask)
        return newTasks
      })
    }
    setDragIndex(null)
    setDragOverIndex(null)
  }, [dragIndex, dragOverIndex])

  if (showArchive) {
    return (
      <ArchiveScreen
        sessions={sessions}
        onBack={() => setShowArchive(false)}
      />
    )
  }

  return (
    <div
      className="flex flex-col h-full relative"
      style={{ backgroundColor: "#F7F5F0" }}
    >
      {/* Save button — top-left, visible when tower has stones */}
      {tasks.length > 0 && (
        <button
          onClick={() => setShowSaveDialog(true)}
          className="absolute top-6 left-6 text-foreground hover:opacity-60 transition-opacity z-10"
          style={{ fontSize: "11px", letterSpacing: "0.04em" }}
          aria-label="Save tower"
        >
          Save
        </button>
      )}

      {/* Archive link */}
      {sessions.length > 0 && (
        <button
          onClick={() => setShowArchive(true)}
          className="absolute top-6 right-6 text-foreground hover:opacity-60 transition-opacity z-10"
          style={{ fontSize: "11px", letterSpacing: "0.04em" }}
          aria-label="View completed towers"
        >
          Towers
        </button>
      )}

      <SaveTowerDialog
        open={showSaveDialog}
        stoneCount={tasks.length}
        completedCount={tasks.filter((t) => !!t.completedAt).length}
        onSave={handleSave}
        onCancel={() => setShowSaveDialog(false)}
      />

      {/* Stone stack area */}
      <div
        ref={stackRef}
        className="flex-1 overflow-y-auto"
        style={{ minHeight: 0 }}
        onClick={(e) => {
          if (e.target === e.currentTarget && expandedId) {
            setExpandedId(null)
          }
        }}
      >
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-foreground opacity-30" style={{ fontSize: "13px" }}>
              No stones yet
            </p>
          </div>
        ) : (() => {
          // Each stone is 208px tall, overlapping by 72px → 136px step per stone
          const STONE_H = 208
          const OVERLAP = 72
          const STEP = STONE_H - OVERLAP
          const PAD_TOP = 48
          const PAD_BOTTOM = 4
          const towerH = PAD_TOP + STONE_H + (tasks.length - 1) * STEP + PAD_BOTTOM

          return (
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", minHeight: "100%" }}>
            <div
              ref={towerRef}
              style={{ position: "relative", width: "100%", height: towerH, transformOrigin: "bottom center" }}
            >
              {tasks.map((task, i) => {
                const isCompleted = !!task.completedAt
                const topPos = PAD_TOP + i * STEP
                return (
                  <div
                    key={task.id}
                    className="flex flex-col items-center"
                    style={{
                      position: "absolute",
                      top: topPos,
                      left: 0,
                      right: 0,
                      zIndex: tasks.length - i,
                      transition: "top 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      transform:
                        dragOverIndex !== null &&
                        dragIndex !== null &&
                        i === dragOverIndex &&
                        i !== dragIndex
                          ? "translateY(14px)"
                          : "translateY(0)",
                    }}
                    draggable={!expandedId && !completingId && !isCompleted}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move"
                      handleDragStart(i)
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      handleDragOver(i)
                    }}
                    onDragEnd={handleDragEnd}
                    onPointerDown={() => handlePointerDown(task.id, isCompleted)}
                    onPointerUp={() => handlePointerUp(task.id)}
                    onPointerLeave={() => {
                      if (holdActiveRef.current && completionProgress < 100) {
                        clearAllTimers()
                        setCompletingId(null)
                        setCompletionProgress(0)
                        holdActiveRef.current = false
                      }
                    }}
                    onPointerCancel={() => {
                      clearAllTimers()
                      setCompletingId(null)
                      setCompletionProgress(0)
                      holdActiveRef.current = false
                    }}
                  >
                    <div
                      className={task.id === newStoneId ? "stone-fall" : ""}
                      style={task.id === newStoneId ? ({ "--fall-dur": `${520 + (hashString(task.id) % 200)}ms` } as React.CSSProperties) : undefined}
                    >
                      <Stone
                        id={task.id}
                        text={task.text}
                        createdAt={task.createdAt}
                        isExpanded={expandedId === task.id}
                        isFaded={expandedId !== null && expandedId !== task.id}
                        isCompleting={completingId === task.id}
                        completionProgress={
                          completingId === task.id ? completionProgress : 0
                        }
                        isCompleted={isCompleted}
                        isDragging={dragIndex === i}
                      />

                      {expandedId === task.id && (
                        <StoneDetail
                          task={task}
                          onDelete={() => removeTask(task.id)}
                          onSetPriority={(p) => updatePriority(task.id, p)}
                          onClose={() => setExpandedId(null)}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            </div>
          )
        })()}
      </div>

      {/* Add stone area */}
      <div
        className="flex flex-col items-center justify-start"
        style={{ paddingTop: "20px", paddingBottom: "32px", flexShrink: 0 }}
      >
        <AddStoneButton onAdd={addTask} />

        {tasks.length > 0 && tasks.filter(t => !t.completedAt).length > 0 && !expandedId && !completingId && (
          <p
            className="mt-4 text-foreground opacity-20"
            style={{ fontSize: "10px", letterSpacing: "0.02em" }}
          >
            hold to complete
          </p>
        )}
      </div>
    </div>
  )
}
