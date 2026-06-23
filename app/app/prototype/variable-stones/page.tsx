"use client"

import { VariableStoneSpike } from "@/components/variable-stone-spike"

export default function VariableStonesPrototypePage() {
  return (
    <div
      className="min-h-[var(--app-height,100dvh)] flex flex-col items-center justify-center"
      style={{ backgroundColor: "#E8E6E1" }}
    >
      <p
        className="text-foreground opacity-50 mb-6"
        style={{ fontSize: "11px", letterSpacing: "0.04em" }}
      >
        Phase 0 · variable stone size spike
      </p>
      <VariableStoneSpike viewportScale={1} />
    </div>
  )
}
