"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface SaveTowerDialogProps {
  open: boolean
  stoneCount: number
  completedCount: number
  onSave: (name: string, startFresh: boolean) => void
  onCancel: () => void
}

function defaultName(): string {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function SaveTowerDialog({
  open,
  stoneCount,
  completedCount,
  onSave,
  onCancel,
}: SaveTowerDialogProps) {
  const [name, setName] = useState(defaultName)

  // Reset name each time dialog opens
  useEffect(() => {
    if (open) setName(defaultName())
  }, [open])

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-xs p-6"
        style={{
          backgroundColor: "#F7F5F0",
          borderRadius: 0,
          border: "1px solid #000",
          fontFamily: "'IBM Plex Mono', monospace",
        }}
      >
        <DialogHeader>
          <DialogTitle
            style={{ fontSize: "13px", fontWeight: 500, fontFamily: "inherit" }}
          >
            Save Tower
          </DialogTitle>
        </DialogHeader>

        {/* Name input */}
        <div className="mt-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: "100%",
              border: "1px solid #000",
              background: "transparent",
              fontFamily: "inherit",
              fontSize: "13px",
              padding: "8px",
              outline: "none",
            }}
            placeholder="Tower name"
            autoFocus
          />
        </div>

        {/* Summary */}
        <p
          className="text-foreground opacity-40"
          style={{ fontSize: "11px", marginTop: "8px" }}
        >
          {stoneCount} {stoneCount === 1 ? "stone" : "stones"} · {completedCount} completed
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-6">
          <button
            onClick={() => onSave(name.trim() || defaultName(), false)}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#000",
              color: "#F7F5F0",
              fontFamily: "inherit",
              fontSize: "11px",
              letterSpacing: "0.04em",
              border: "none",
              cursor: "pointer",
            }}
          >
            Save & Keep Building
          </button>

          <button
            onClick={() => onSave(name.trim() || defaultName(), true)}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "transparent",
              color: "#000",
              fontFamily: "inherit",
              fontSize: "11px",
              letterSpacing: "0.04em",
              border: "1px solid #000",
              cursor: "pointer",
            }}
          >
            Save & Start New Tower
          </button>

          <button
            onClick={onCancel}
            style={{
              width: "100%",
              padding: "6px",
              backgroundColor: "transparent",
              color: "#000",
              fontFamily: "inherit",
              fontSize: "11px",
              opacity: 0.4,
              border: "none",
              cursor: "pointer",
              marginTop: "2px",
            }}
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
