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

  // Full-bleed on phones; framed handset preview on larger screens
  return (
    <div
      className="flex min-h-dvh items-center justify-center bg-[#E8E6E1]"
    >
      <div
        className="app-shell relative h-dvh w-full overflow-hidden bg-[#F7F5F0] sm:h-dvh sm:w-[390px] sm:max-h-[844px] sm:shadow-2xl"
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
            hasOnboarded={appState.hasOnboarded}
          />
        )}
      </div>
    </div>
  )
}
