"use client"

import type { Task } from "@/lib/store"

interface StoneDetailProps {
  task: Task
  onDelete: () => void
  onClose: () => void
}

export function StoneDetail({ task, onDelete }: StoneDetailProps) {
  return (
    <div
      className="flex justify-center animate-fade-in"
      style={{ marginTop: "12px" }}
    >
      <button
        className="text-foreground opacity-60 hover:opacity-100 transition-opacity font-medium"
        style={{ fontSize: "15px" }}
        // Keep the tap from reaching the stone wrapper: its short-tap
        // handler would collapse the panel on pointerup, unmounting this
        // button before the browser dispatches the click
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        aria-label={`Delete task: ${task.text}`}
      >
        Delete
      </button>
    </div>
  )
}
