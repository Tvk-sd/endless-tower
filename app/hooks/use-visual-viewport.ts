"use client"

import { useEffect, useState } from "react"

export interface VisualViewportRect {
  top: number
  height: number
}

/** Tracks the visible viewport rect (above the keyboard on mobile). */
export function useVisualViewport(): VisualViewportRect {
  const [rect, setRect] = useState<VisualViewportRect>(() => ({
    top: 0,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  }))

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const update = () => {
      setRect({ top: vv.offsetTop, height: vv.height })
    }

    update()
    vv.addEventListener("resize", update)
    vv.addEventListener("scroll", update)
    return () => {
      vv.removeEventListener("resize", update)
      vv.removeEventListener("scroll", update)
    }
  }, [])

  return rect
}
