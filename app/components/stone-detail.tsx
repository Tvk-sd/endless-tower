"use client"

import type { Task } from "@/lib/store"

interface StoneDetailProps {
  task: Task
  onEdit: () => void
  onDelete: () => void
  onSetPriority: (priority: Task["priority"]) => void
  onClose: () => void
}

export function StoneDetail({ task, onEdit, onDelete }: StoneDetailProps) {
  return (
    <div
      className="flex flex-col items-center gap-3 animate-fade-in"
      style={{ marginTop: "12px" }}
    >
      <button
        className="text-foreground hover:opacity-60 transition-opacity"
        style={{ fontSize: "11px", letterSpacing: "0.04em" }}
        onClick={(e) => {
          e.stopPropagation()
          onEdit()
        }}
        aria-label={`Edit task: ${task.text}`}
      >
        Edit
      </button>
      <button
        className="text-foreground opacity-40 hover:opacity-100 transition-opacity"
        style={{ fontSize: "11px", letterSpacing: "0.04em" }}
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
