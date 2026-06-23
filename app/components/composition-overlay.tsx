"use client"

import { useState, useEffect, useCallback, type RefObject } from "react"
import { createPortal } from "react-dom"
import { Stone } from "./stone"
import { useVisualViewport } from "@/hooks/use-visual-viewport"

export type CompositionMode =
  | { type: "add"; stoneId: string }
  | { type: "edit"; stoneId: string; initialText: string }

interface CompositionOverlayProps {
  mode: CompositionMode
  scale: number
  inputRef: RefObject<HTMLInputElement | null>
  onSubmit: (text: string) => void
  onCancel: () => void
}

export function CompositionOverlay({
  mode,
  scale,
  inputRef,
  onSubmit,
  onCancel,
}: CompositionOverlayProps) {
  const viewport = useVisualViewport()
  const [mounted, setMounted] = useState(false)
  const [text, setText] = useState(
    mode.type === "edit" ? mode.initialText : ""
  )

  useEffect(() => setMounted(true), [])

  const submit = useCallback(() => {
    const trimmed = text.trim()
    if (mode.type === "add" && !trimmed) {
      onCancel()
      return
    }
    if (mode.type === "edit" && !trimmed) {
      onCancel()
      return
    }
    onSubmit(trimmed)
  }, [text, mode.type, onSubmit, onCancel])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onCancel])

  const fullHeight =
    typeof window !== "undefined"
      ? Number(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--app-height"
          )
        ) || window.innerHeight
      : viewport.height
  const keyboardOpen = viewport.height < fullHeight * 0.75

  const label = mode.type === "add" ? "Name new stone" : "Edit stone"

  const content = (
    <>
      <style>{`
        @keyframes composition-stone-in {
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .composition-stone-in {
          animation: composition-stone-in 0.28s cubic-bezier(0.22, 0.68, 0.35, 1) both;
        }
      `}</style>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        style={{
          position: "fixed",
          top: viewport.top,
          left: 0,
          right: 0,
          height: viewport.height,
          zIndex: 10000,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: keyboardOpen ? "center" : "flex-start",
          paddingTop: keyboardOpen ? 0 : Math.max(48, viewport.height * 0.14),
          paddingLeft: 24,
          paddingRight: 24,
          paddingBottom: keyboardOpen ? 12 : 0,
          pointerEvents: "auto",
          transition: "top 0.25s ease, height 0.25s ease, padding 0.25s ease",
          backgroundColor: "transparent",
        }}
      >
        <div
          className="composition-stone-in flex flex-col items-center"
          style={{ maxWidth: "100%" }}
        >
          <Stone
            id={mode.stoneId}
            text={text}
            scale={scale}
            isExpanded
            isEditing
            editText={text}
            onEditTextChange={setText}
            editPlaceholder={
              mode.type === "add" ? "Name this stone..." : undefined
            }
            inputRef={inputRef}
            onSubmitEdit={submit}
            onCancelEdit={onCancel}
          />

          <div
            className="flex items-center justify-between mt-8"
            style={{
              width: "min(240px, calc(100vw - 48px))",
              fontSize: "15px",
              letterSpacing: "0.04em",
            }}
          >
            <button
              type="button"
              onClick={onCancel}
              className="text-foreground opacity-50 hover:opacity-70 transition-opacity"
              style={{ fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              className="text-foreground hover:opacity-60 transition-opacity"
              style={{ fontWeight: 600 }}
            >
              {mode.type === "add" ? "Add" : "Done"}
            </button>
          </div>
        </div>
      </div>
    </>
  )

  if (!mounted) return null
  return createPortal(content, document.body)
}
