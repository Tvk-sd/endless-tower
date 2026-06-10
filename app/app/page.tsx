"use client"

import { useState, useEffect, useCallback } from "react"
import { LoadingScreen } from "@/components/loading-screen"
import { OnboardingScreen } from "@/components/onboarding-screen"
import { MainScreen } from "@/components/main-screen"
import { loadState, saveState } from "@/lib/store"
import type { AppScreen, AppState } from "@/lib/store"

export default function Page() {
  const [screen, setScreen] = useState<AppScreen>("loading")
  const [appState, setAppState] = useState<AppState | null>(null)

  useEffect(() => {
    const state = loadState()
    setAppState(state)
  }, [])

  const handleLoadingComplete = useCallback(() => {
    if (appState?.hasOnboarded) {
      setScreen("main")
    } else {
      setScreen("onboarding")
    }
  }, [appState])

  const handleOnboardingComplete = useCallback(() => {
    if (appState) {
      const newState = { ...appState, hasOnboarded: true }
      setAppState(newState)
      saveState(newState)
    }
    setScreen("main")
  }, [appState])

  // Mobile frame wrapper — full screen on mobile, 390x844 framed on desktop
  return (
    <div
      className="flex items-center justify-center min-h-screen sm:min-h-screen"
      style={{ backgroundColor: "#E8E6E1" }}
    >
      <div
        className="relative overflow-hidden sm:shadow-2xl"
        style={{
          width: "min(390px, 100vw)",
          height: "100dvh",
          maxHeight: "844px",
          backgroundColor: "#F7F5F0",
        }}
      >
        {screen === "loading" && (
          <LoadingScreen onComplete={handleLoadingComplete} />
        )}

        {screen === "onboarding" && (
          <OnboardingScreen onStart={handleOnboardingComplete} />
        )}

        {screen === "main" && appState && (
          <MainScreen
            initialTasks={appState.tasks}
            initialSessions={appState.sessions}
            initialSunk={appState.sunk}
            hasOnboarded={appState.hasOnboarded}
          />
        )}
      </div>
    </div>
  )
}
