"use client"

import { useEffect, useState } from "react"
import { getTowerScale } from "@/lib/tower-layout"

export function useTowerScale() {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const update = () => setScale(getTowerScale(window.innerWidth))
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  return scale
}
