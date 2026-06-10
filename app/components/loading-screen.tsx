"use client"

import { useEffect, useState } from "react"
import { DecorativeStone } from "./stone"

interface LoadingScreenProps {
  onComplete: () => void
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 100)
    const fadeTimer = setTimeout(() => setFading(true), 2200)
    const completeTimer = setTimeout(() => onComplete(), 2800)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(fadeTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  const stones = [
    { size: 80, index: 0 },
    { size: 70, index: 2 },
    { size: 60, index: 4 },
    { size: 50, index: 6 },
    { size: 42, index: 8 },
  ]

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen"
      style={{
        backgroundColor: "#F7F5F0",
        opacity: fading ? 0 : visible ? 1 : 0,
        transition: "opacity 0.6s ease",
      }}
    >
      <div className="flex flex-col items-center">
        <div className="flex flex-col items-center">
          {stones.map((s, i) => (
            <div
              key={i}
              style={{
                  marginTop: i === 0 ? 0 : -32,
                zIndex: i,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(12px)",
                transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.12}s`,
              }}
            >
              <DecorativeStone
                size={s.size}
                shapeIndex={s.index}
              />
            </div>
          ))}
        </div>

        <p
          className="mt-10 text-foreground"
          style={{
            fontSize: "16px",
            letterSpacing: "0.08em",
            opacity: visible ? 1 : 0,
            transition: "opacity 0.6s ease 0.6s",
          }}
        >
          Endless Tower
        </p>
      </div>
    </div>
  )
}
