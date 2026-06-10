"use client"

import { useState, useRef, useEffect, useLayoutEffect } from "react"
import type { CompletedSession } from "@/lib/store"
import { Stone } from "./stone"
import { AddStoneButton } from "./add-stone-button"
import { hashString } from "@/lib/stone-paths"
import {
  TOWER_PAD_TOP,
  STONE_STEP,
  getTowerHeight,
} from "@/lib/tower-layout"
import { useTowerScale } from "@/hooks/use-tower-scale"

interface TowerDetailScreenProps {
  session: CompletedSession
  onBack: () => void
  onAddTask: (text: string) => string
}

export function TowerDetailScreen({
  session,
  onBack,
  onAddTask,
}: TowerDetailScreenProps) {
  const tasks = session.tasks
  const completedCount = tasks.filter((t) => !!t.completedAt).length
  const dateStr = new Date(session.completedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  const scale = useTowerScale()
  const PAD_TOP = TOWER_PAD_TOP * scale
  const STEP = STONE_STEP * scale
  const towerH = getTowerHeight(tasks.length, scale)

  const [newStoneId, setNewStoneId] = useState<string | null>(null)
  const [fallingId, setFallingId] = useState<string | null>(null)
  const [fallFromPx, setFallFromPx] = useState(360)
  const [fallPadPx, setFallPadPx] = useState(0)

  const stackRef = useRef<HTMLDivElement>(null)
  const towerRef = useRef<HTMLDivElement>(null)
  const prevTaskCountRef = useRef(tasks.length)

  useEffect(() => {
    if (tasks.length > prevTaskCountRef.current && stackRef.current) {
      stackRef.current.scrollTop = 0
    }
    prevTaskCountRef.current = tasks.length
  }, [tasks.length])

  useLayoutEffect(() => {
    if (!newStoneId || !towerRef.current || !stackRef.current) return
    const stack = stackRef.current
    const tower = towerRef.current
    stack.scrollTop = 0
    const landingInView = tower.offsetTop + TOWER_PAD_TOP * scale - stack.scrollTop
    const fall = Math.max(landingInView + 16, Math.round(stack.clientHeight * 0.55))
    setFallFromPx(fall)
    setFallPadPx(Math.max(0, fall - landingInView))
    setFallingId(newStoneId)
  }, [newStoneId, tasks.length, scale])

  const handleAdd = (text: string) => {
    const id = onAddTask(text)
    setNewStoneId(id)
    const fallMs = 640 + (hashString(id) % 160)
    setTimeout(() => {
      setNewStoneId(null)
      setFallingId(null)
      setFallPadPx(0)
    }, fallMs + 120)
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "#F7F5F0" }}
    >
      <style>{`
        @keyframes stone-drop {
          0%   { transform: translateY(calc(-1 * var(--fall-from, 50dvh))); }
          72%  { transform: translateY(8px) scale(1.015); }
          86%  { transform: translateY(-4px) scale(0.995); }
          100% { transform: translateY(0) scale(1); }
        }
        .stone-fall {
          animation: stone-drop var(--fall-dur, 0.72s) cubic-bezier(0.22, 0.68, 0.35, 1) both;
          will-change: transform;
        }
      `}</style>

      <div className="flex items-center justify-between px-6 pt-10 pb-4 flex-shrink-0">
        <button
          onClick={onBack}
          className="text-foreground opacity-60 hover:opacity-100 transition-opacity"
          style={{ fontSize: "11px", letterSpacing: "0.04em" }}
          aria-label="Back to towers"
        >
          {"\u2190 Towers"}
        </button>
        <p
          className="text-foreground text-center flex-1 mx-4 truncate"
          style={{ fontSize: "11px", letterSpacing: "0.04em" }}
        >
          {session.name || dateStr}
        </p>
        <div style={{ width: "52px" }} aria-hidden />
      </div>

      <p
        className="text-foreground opacity-40 text-center px-6 pb-4 flex-shrink-0"
        style={{ fontSize: "10px", letterSpacing: "0.02em" }}
      >
        {dateStr} · {tasks.length} {tasks.length === 1 ? "stone" : "stones"} ·{" "}
        {completedCount} done
      </p>

      <div
        ref={stackRef}
        className="flex-1 overflow-y-auto"
        style={{ minHeight: 0 }}
      >
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-foreground opacity-30" style={{ fontSize: "13px" }}>
              No stones yet
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              minHeight: "100%",
              paddingTop: fallPadPx,
              transition: newStoneId ? "none" : "padding-top 0.35s ease",
            }}
          >
            <div
              ref={towerRef}
              style={{ position: "relative", width: "100%", height: towerH }}
            >
              {tasks.map((task, i) => {
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
                      zIndex:
                        task.id === newStoneId ? tasks.length + 10 : tasks.length - i,
                      transition: newStoneId ? "none" : "top 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    <div
                      className={task.id === fallingId ? "stone-fall" : ""}
                      style={
                        task.id === newStoneId
                          ? ({
                              "--fall-dur": `${640 + (hashString(task.id) % 160)}ms`,
                              "--fall-from": `${fallFromPx}px`,
                            } as React.CSSProperties)
                          : undefined
                      }
                    >
                      <Stone
                        id={task.id}
                        text={task.text}
                        createdAt={task.createdAt}
                        isCompleted={!!task.completedAt}
                        scale={scale}
                        readOnly
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div
        className="app-footer flex flex-col items-center justify-start"
        style={{ paddingTop: "4px", flexShrink: 0 }}
      >
        <AddStoneButton onAdd={handleAdd} />
      </div>
    </div>
  )
}
