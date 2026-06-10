"use client"

import { useState } from "react"
import { DecorativeStone } from "./stone"

interface OnboardingScreenProps {
  onStart: () => void
}

const EXAMPLE_TASKS = [
  "Call Thea",
  "Check out colors",
  "Build something",
]

export function OnboardingScreen({ onStart }: OnboardingScreenProps) {
  const [visible, setVisible] = useState(true)

  const stones = [
    { size: 130, index: 0 },
    { size: 125, index: 3 },
    { size: 120, index: 6 },
  ]

  const instructions = [
    "Tap a stone to see details",
    "Hold to complete",
    "Drag to reprioritise",
  ]

  return (
    <div
      className="flex flex-col h-full"
      style={{
        backgroundColor: "#F7F5F0",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease",
      }}
    >
      {/* Top half -- stone stack */}
      <div className="flex-1 flex flex-col items-center justify-end pb-8">
        <div className="flex flex-col items-center">
          {stones.map((s, i) => (
            <div
              key={i}
              className="relative flex items-center justify-center"
              style={{
                marginTop: i === 0 ? 0 : -55,
                width: s.size,
                height: s.size,
                zIndex: i,
              }}
            >
              <DecorativeStone
                size={s.size}
                shapeIndex={s.index}
              />
              <span
                className="absolute text-center text-foreground leading-snug"
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  maxWidth: s.size - 40,
                  wordBreak: "break-word",
                }}
              >
                {EXAMPLE_TASKS[i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom half -- instructions */}
      <div className="flex-1 flex flex-col justify-start px-12 pt-8">
        <div className="flex flex-col gap-6">
          {instructions.map((inst, i) => (
            <div
              key={i}
              className="flex items-center gap-3"
              style={{
                animation: `fade-in 0.4s ease-out ${0.2 + i * 0.15}s both`,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2,8 C4,8 8,8 11,8 M8,4 L12,8 L8,12"
                  stroke="#000000"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-foreground" style={{ fontSize: "11px" }}>
                {inst}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            setVisible(false)
            setTimeout(onStart, 500)
          }}
          className="mt-10 text-left text-foreground hover:opacity-60 transition-opacity"
          style={{ fontSize: "13px" }}
          aria-label="Start stacking"
        >
          {"Start stacking \u2192"}
        </button>
      </div>
    </div>
  )
}
