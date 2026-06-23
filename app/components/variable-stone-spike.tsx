"use client"

import { useMemo } from "react"
import { Stone } from "@/components/stone"
import { getStoneTransform } from "@/lib/stone-paths"
import {
  computeStackLayout,
  stoneWouldClip,
  FRAME_W,
} from "@/lib/tower-layout"
import { getStoneDimensions } from "@/lib/stone-size"

const SPIKE_TASKS = [
  { id: "spike-a1", text: "Milk" },
  { id: "spike-b2", text: "Call mom about appointment" },
  { id: "spike-c3", text: "Finish Q3 roadmap review with design" },
  { id: "spike-d4", text: "Buy groceries" },
  { id: "spike-e5", text: "Water the plants" },
  { id: "spike-f6", text: "Schedule dentist and pick up prescription before Friday" },
]

export function VariableStoneSpike({ viewportScale = 1 }: { viewportScale?: number }) {
  const { slots, towerHeight } = useMemo(
    () => computeStackLayout(SPIKE_TASKS, viewportScale),
    [viewportScale]
  )

  const fixedTowerH = useMemo(() => {
    const n = SPIKE_TASKS.length
    const padTop = 48 * viewportScale
    const stoneH = 208 * viewportScale
    const step = 136 * viewportScale
    return padTop + stoneH + (n - 1) * step
  }, [viewportScale])

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start justify-center p-6">
      {/* Variable-size stack */}
      <div>
        <p
          className="text-foreground opacity-40 mb-3 text-center"
          style={{ fontSize: "11px", letterSpacing: "0.04em" }}
        >
          Variable hug (Phase 0)
        </p>
        <div
          style={{
            width: FRAME_W * viewportScale,
            height: Math.max(towerHeight + 40, 400),
            background: "#F7F5F0",
            position: "relative",
            overflow: "hidden",
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              height: towerHeight,
              transformOrigin: "bottom center",
            }}
          >
            {SPIKE_TASKS.map((task, i) => {
              const slot = slots[i]
              const transform = getStoneTransform(task.id)
              const clips = stoneWouldClip(
                slot.width,
                transform.offsetX * viewportScale,
                transform.rotation
              )
              return (
                <div
                  key={task.id}
                  style={{
                    position: "absolute",
                    top: slot.top,
                    left: 0,
                    right: 0,
                    zIndex: SPIKE_TASKS.length - i,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Stone
                    id={task.id}
                    text={task.text}
                    width={slot.width}
                    height={slot.height}
                    fontSize={slot.fontSize * viewportScale}
                  />
                  {clips && (
                    <span
                      style={{
                        fontSize: "9px",
                        color: "#c00",
                        marginTop: 2,
                      }}
                    >
                      clip risk
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Fixed-size comparison */}
      <div>
        <p
          className="text-foreground opacity-40 mb-3 text-center"
          style={{ fontSize: "11px", letterSpacing: "0.04em" }}
        >
          Today (fixed size)
        </p>
        <div
          style={{
            width: FRAME_W * viewportScale,
            height: Math.max(fixedTowerH + 40, 400),
            background: "#F7F5F0",
            position: "relative",
            overflow: "hidden",
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          <div style={{ position: "relative", width: "100%", height: fixedTowerH }}>
            {SPIKE_TASKS.map((task, i) => {
              const padTop = 48 * viewportScale
              const step = 136 * viewportScale
              return (
                <div
                  key={task.id}
                  style={{
                    position: "absolute",
                    top: padTop + i * step,
                    left: 0,
                    right: 0,
                    zIndex: SPIKE_TASKS.length - i,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Stone
                    id={task.id}
                    text={task.text}
                    scale={viewportScale}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div
        className="flex-shrink-0"
        style={{
          fontSize: "11px",
          letterSpacing: "0.02em",
          maxWidth: 280,
          fontFamily: "'IBM Plex Mono', monospace",
        }}
      >
        <p className="font-medium mb-3" style={{ fontSize: "11px" }}>
          Dimensions
        </p>
        <ul className="space-y-2 opacity-70">
          {SPIKE_TASKS.map((task) => {
            const dim = getStoneDimensions(task.text, { viewportScale })
            return (
              <li key={task.id}>
                <span className="opacity-50">{dim.scaleFactor.toFixed(2)}×</span>{" "}
                {task.text.slice(0, 28)}
                {task.text.length > 28 ? "…" : ""}
                <br />
                <span className="opacity-40">
                  {Math.round(dim.width)}×{Math.round(dim.height)} · {dim.fontSize}px ·{" "}
                  {dim.lineCount}L
                </span>
              </li>
            )
          })}
        </ul>
        <p className="mt-4 opacity-40">
          Tower H: {Math.round(towerHeight)}px vs fixed {Math.round(fixedTowerH)}px
        </p>
      </div>
    </div>
  )
}
