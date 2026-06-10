"use client"

import { useState, useRef, useEffect } from "react"

interface AddStoneButtonProps {
  onAdd: (text: string) => void
}

export function AddStoneButton({ onAdd }: AddStoneButtonProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [text, setText] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isAdding])

  const handleSubmit = () => {
    const trimmed = text.trim()
    if (trimmed) {
      onAdd(trimmed)
      setText("")
      setIsAdding(false)
    }
  }

  if (isAdding) {
    return (
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit()
            if (e.key === "Escape") {
              setIsAdding(false)
              setText("")
            }
          }}
          placeholder="Name this stone..."
          className="text-center bg-transparent border-b border-foreground text-foreground placeholder:text-foreground/30 outline-none pb-2"
          style={{
            fontSize: "13px",
            width: "240px",
          }}
          aria-label="New task name"
        />
        <div className="flex items-center gap-6">
          <button
            onClick={handleSubmit}
            className="text-foreground hover:opacity-60 transition-opacity"
            style={{ fontSize: "11px" }}
          >
            Add
          </button>
          <button
            onClick={() => {
              setIsAdding(false)
              setText("")
            }}
            className="text-foreground opacity-40 hover:opacity-60 transition-opacity"
            style={{ fontSize: "11px" }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsAdding(true)}
      className="group flex items-center justify-center transition-opacity hover:opacity-60"
      style={{ width: 44, height: 44 }}
      aria-label="Add stone"
    >
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        fill="none"
      >
        <circle
          cx="22"
          cy="22"
          r="21"
          stroke="#000000"
          strokeWidth="1"
        />
        <line
          x1="22"
          y1="14"
          x2="22"
          y2="30"
          stroke="#000000"
          strokeWidth="1"
        />
        <line
          x1="14"
          y1="22"
          x2="30"
          y2="22"
          stroke="#000000"
          strokeWidth="1"
        />
      </svg>
    </button>
  )
}
