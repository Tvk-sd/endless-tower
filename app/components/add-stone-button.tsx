"use client"

interface AddStoneButtonProps {
  onStartAdd: () => void
}

export function AddStoneButton({ onStartAdd }: AddStoneButtonProps) {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ height: 96, width: "100%" }}
    >
      <button
        onClick={onStartAdd}
        className="group flex items-center justify-center transition-opacity hover:opacity-60"
        style={{ width: 44, height: 44 }}
        aria-label="Add stone"
      >
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <circle cx="22" cy="22" r="21" stroke="#000000" strokeWidth="1" />
          <line x1="22" y1="14" x2="22" y2="30" stroke="#000000" strokeWidth="1" />
          <line x1="14" y1="22" x2="30" y2="22" stroke="#000000" strokeWidth="1" />
        </svg>
      </button>
    </div>
  )
}
