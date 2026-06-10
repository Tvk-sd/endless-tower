"use client"

import type { CompletedSession } from "@/lib/store"
import { DecorativeStone } from "./stone"
import { hashString } from "@/lib/stone-paths"

interface ArchiveScreenProps {
  sessions: CompletedSession[]
  onBack: () => void
}

export function ArchiveScreen({ sessions, onBack }: ArchiveScreenProps) {
  return (
    <div
      className="flex flex-col min-h-screen px-6 pt-10 pb-16"
      style={{ backgroundColor: "#F7F5F0" }}
    >
      <div className="flex items-center justify-between mb-10">
        <button
          onClick={onBack}
          className="text-foreground opacity-60 hover:opacity-100 transition-opacity"
          style={{ fontSize: "11px", letterSpacing: "0.04em" }}
          aria-label="Back to main"
        >
          {"\u2190 Back"}
        </button>
        <p
          className="text-foreground"
          style={{ fontSize: "11px", letterSpacing: "0.04em" }}
        >
          Towers
        </p>
      </div>

      {sessions.length === 0 ? (
        <p
          className="text-foreground opacity-40 text-center mt-20"
          style={{ fontSize: "13px" }}
        >
          No towers completed yet
        </p>
      ) : (
        <div className="grid grid-cols-2" style={{ gap: "24px" }}>
          {[...sessions].reverse().map((session) => {
            const dateStr = new Date(session.completedAt).toLocaleDateString(
              "en-US",
              { month: "short", day: "numeric" }
            )
            const previewTasks = session.tasks.slice(0, 8)
            const extraCount = session.tasks.length - previewTasks.length
            const completedCount = session.tasks.filter((t) => !!t.completedAt).length

            return (
              <div
                key={session.id}
                className="flex flex-col items-center animate-fade-in"
              >
                <div className="flex flex-col items-center">
                  {extraCount > 0 && (
                    <p
                      className="text-foreground opacity-30 mb-1"
                      style={{ fontSize: "9px" }}
                    >
                      +{extraCount}
                    </p>
                  )}
                  {previewTasks.map((task, i) => {
                    const size = Math.max(24, 40 - i * 2)
                    return (
                      <div
                        key={task.id}
                        style={{
                          marginTop: i === 0 ? 0 : -16,
                          zIndex: i,
                        }}
                      >
                        {/* Hash-derived shape + color so mini towers mirror the real stones */}
                        <DecorativeStone
                          size={size}
                          shapeIndex={hashString(task.id)}
                          filled={!!task.completedAt}
                          fillColorIndex={hashString(task.id)}
                        />
                      </div>
                    )
                  })}
                </div>

                {session.name && (
                  <p
                    className="text-foreground mt-3"
                    style={{ fontSize: "10px", opacity: 0.7 }}
                  >
                    {session.name}
                  </p>
                )}
                <p
                  className="text-foreground opacity-50"
                  style={{ fontSize: "10px", marginTop: session.name ? "1px" : "12px" }}
                >
                  {dateStr}
                </p>
                <p
                  className="text-foreground opacity-30"
                  style={{ fontSize: "9px" }}
                >
                  {session.tasks.length} {session.tasks.length === 1 ? "stone" : "stones"} · {completedCount} done
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
