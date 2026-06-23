"use client"

import { useEffect } from "react"

/** Pin layout height to window.innerHeight so the iOS keyboard doesn't shrink dvh. */
export function useAppHeight() {
  useEffect(() => {
    const apply = () => {
      document.documentElement.style.setProperty(
        "--app-height",
        `${window.innerHeight}px`
      )
    }
    apply()
    window.addEventListener("orientationchange", apply)
    return () => window.removeEventListener("orientationchange", apply)
  }, [])
}
