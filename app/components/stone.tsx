"use client"

import { useMemo, useRef } from "react"
import {
  getStoneShapeByHash,
  getStoneTransform,
  getStoneShape,
  getCompletionColor,
  COMPLETION_COLORS,
} from "@/lib/stone-paths"

export interface StoneProps {
  id: string
  text: string
  createdAt?: number
  isExpanded?: boolean
  isFaded?: boolean
  isCompleting?: boolean
  completionProgress?: number
  isCompleted?: boolean
  className?: string
  isDragging?: boolean
  isEditing?: boolean
  readOnly?: boolean
  onStartEdit?: () => void
  onSubmitEdit?: (text: string) => void
  onCancelEdit?: () => void
}

const STONE_W = 160
const STONE_H = 208 // taller to match 200x260 viewBox aspect ratio
export const EXPANDED_W = 240
const EXPANDED_H = 312

export function Stone({
  id,
  text,
  createdAt,
  isExpanded = false,
  isFaded = false,
  isCompleting = false,
  completionProgress = 0,
  isCompleted = false,
  className = "",
  isDragging = false,
  isEditing = false,
  readOnly = false,
  onStartEdit,
  onSubmitEdit,
  onCancelEdit,
}: StoneProps) {
  const editInputRef = useRef<HTMLInputElement>(null)

  const submitEdit = () => {
    const value = editInputRef.current?.value.trim()
    if (value && value !== text) {
      onSubmitEdit?.(value)
    } else {
      onCancelEdit?.()
    }
  }
  const shape = useMemo(() => getStoneShapeByHash(id), [id])
  const transform = useMemo(() => getStoneTransform(id), [id])
  const clipId = useMemo(() => `clip-${id.replace(/[^a-zA-Z0-9]/g, "")}`, [id])
  const fillColor = useMemo(() => getCompletionColor(id), [id])

  const w = isExpanded ? EXPANDED_W : STONE_W
  const h = isExpanded ? EXPANDED_H : STONE_H

  const isFilled = isCompleted || (isCompleting && completionProgress >= 100)
  const fillProgress = isCompleted ? 100 : completionProgress

  // The clip rect needs to reference the viewBox coordinate system (260 tall)
  const viewBoxH = 260

  const textColor = isFilled || (isCompleting && completionProgress > 45) ? "#FFFFFF" : "#000000"

  const dateStr = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{
        width: w,
        height: h,
        opacity: isFaded ? 0.15 : 1,
        transform: `rotate(${isExpanded ? 0 : transform.rotation}deg) translateX(${isExpanded ? 0 : transform.offsetX}px) ${isDragging ? "scale(1.08)" : "scale(1)"}`,
        transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: isDragging ? 50 : "auto",
        cursor: readOnly ? "default" : isDragging ? "grabbing" : "pointer",
      }}
      role={readOnly ? undefined : "button"}
      tabIndex={readOnly ? undefined : 0}
      aria-label={`Task: ${text}${isCompleted ? " (completed)" : ""}`}
    >
      <svg
        viewBox={shape.viewBox}
        width={w}
        height={h}
        className="absolute inset-0"
        style={{ overflow: "visible" }}
      >
        <defs>
          <clipPath id={clipId}>
            <rect
              x="0"
              y={`${viewBoxH - (fillProgress / 100) * viewBoxH}`}
              width="200"
              height={`${(fillProgress / 100) * viewBoxH}`}
            />
          </clipPath>
        </defs>

        {/* White fill background */}
        <path d={shape.path} fill="#FFFFFF" />

        {/* Color fill -- rises from bottom during hold, stays when completed */}
        {(isCompleting || isCompleted) && fillProgress > 0 && (
          <path
            d={shape.path}
            fill={fillColor}
            clipPath={`url(#${clipId})`}
          />
        )}

        {/* Thin dark outline */}
        <path
          d={shape.path}
          fill="none"
          stroke={isFilled ? fillColor : "#333333"}
          strokeWidth="1.5"
          strokeLinejoin="round"
          style={{ transition: "stroke 0.3s ease" }}
        />
      </svg>

      {/* Task text (+ date when expanded) -- centered on the stone shape */}
      <div
        className="absolute z-10 text-center pointer-events-none"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: w - 50,
          top: `${((shape.topY + shape.bottomY) / 2 / viewBoxH) * 100}%`,
          transform: "translateY(-50%)",
        }}
      >
        {isEditing ? (
          <input
            ref={editInputRef}
            type="text"
            defaultValue={text}
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitEdit()
              if (e.key === "Escape") onCancelEdit?.()
            }}
            onBlur={submitEdit}
            className="leading-snug font-medium text-center bg-transparent outline-none"
            style={{
              fontSize: isExpanded ? "15px" : "13px",
              color: textColor,
              width: w - 60,
              pointerEvents: "auto",
              borderBottom: `1px solid ${textColor}`,
              paddingBottom: "2px",
            }}
            aria-label="Edit task name"
          />
        ) : (
          <span
            className="leading-snug font-medium"
            style={{
              fontSize: isExpanded ? "15px" : "13px",
              wordBreak: "break-word",
              color: textColor,
              transition: "color 0.3s ease, font-size 0.35s ease",
              // Tap on the text edits in place; hold still completes
              // (only short taps are intercepted — see onPointerUp)
              pointerEvents: onStartEdit && !readOnly ? "auto" : undefined,
              cursor: onStartEdit && !readOnly ? "text" : undefined,
            }}
            onPointerUp={(e) => {
              if (onStartEdit && !readOnly && !isCompleting) {
                e.stopPropagation()
                onStartEdit()
              }
            }}
          >
            {text}
          </span>
        )}
        {isExpanded && dateStr && (
          <span
            style={{
              fontSize: "11px",
              color: textColor,
              opacity: 0.6,
              marginTop: "6px",
              transition: "color 0.3s ease",
            }}
          >
            {dateStr}
          </span>
        )}
      </div>
    </div>
  )
}

// Decorative stone for loading / archive / onboarding
export function DecorativeStone({
  size,
  shapeIndex,
  filled,
  fillColorIndex,
}: {
  size: number
  shapeIndex: number
  filled?: boolean
  fillColorIndex?: number
}) {
  const shape = getStoneShape(shapeIndex)
  const color = filled
    ? COMPLETION_COLORS[(fillColorIndex ?? shapeIndex) % COMPLETION_COLORS.length]
    : undefined

  const h = size * (260 / 200) // match viewBox aspect ratio

  return (
    <svg viewBox={shape.viewBox} width={size} height={h} style={{ overflow: "visible" }}>
      <path d={shape.path} fill={color ?? "#FFFFFF"} />
      <path
        d={shape.path}
        fill="none"
        stroke={color ?? "#333333"}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}
