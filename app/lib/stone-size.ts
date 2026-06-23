import {
  STONE_W,
  STONE_H,
} from "@/lib/tower-layout"

export const MIN_SCALE = 1.0
export const MAX_SCALE = 1.35

/** Matches stone.tsx: maxWidth = w - 50 */
export const TEXT_INSET_X = 50

/** Average visible shape band in viewBox units (from stone-paths). */
const VIEWBOX_H = 260
const SHAPE_VISIBLE_H = 168

/** Fraction of visible silhouette height usable for text before scaling up. */
const TEXT_BAND_RATIO = 0.62

export const BASE_FONT_SIZE = 13
export const FONT_STEPS = [13, 12, 11] as const

/** Per extra line, nudge scale up (2 lines → +6.5%, 3 → +13%, …). */
const LINE_SCALE_STEP = 0.065

const FONT_FAMILY = "'IBM Plex Mono', 'Courier New', monospace"
const LINE_HEIGHT_RATIO = 1.35

export interface StoneDimensions {
  width: number
  height: number
  scaleFactor: number
  fontSize: number
  lineCount: number
}

export interface MeasuredTextBlock {
  lineCount: number
  contentWidth: number
  contentHeight: number
  fontSize: number
}

/** Wrap and measure text at a fixed max line width (browser only). */
export function measureTextBlock(
  text: string,
  maxLineWidth: number,
  fontSize: number
): MeasuredTextBlock {
  if (typeof document === "undefined") {
    const charsPerLine = Math.max(1, Math.floor(maxLineWidth / (fontSize * 0.6)))
    const lineCount = Math.max(1, Math.ceil(text.length / charsPerLine))
    return {
      lineCount,
      contentWidth: Math.min(maxLineWidth, text.length * fontSize * 0.6),
      contentHeight: lineCount * fontSize * LINE_HEIGHT_RATIO,
      fontSize,
    }
  }

  const el = document.createElement("div")
  el.style.cssText = [
    "position:fixed",
    "left:-9999px",
    "top:0",
    "visibility:hidden",
    "pointer-events:none",
    `width:${maxLineWidth}px`,
    `font-family:${FONT_FAMILY}`,
    `font-size:${fontSize}px`,
    `font-weight:500`,
    `line-height:${LINE_HEIGHT_RATIO}`,
    "word-break:break-word",
    "text-align:center",
  ].join(";")
  el.textContent = text.trim() || " "
  document.body.appendChild(el)

  const lineHeight = fontSize * LINE_HEIGHT_RATIO
  const contentHeight = el.scrollHeight
  const lineCount = Math.max(1, Math.round(contentHeight / lineHeight))
  const contentWidth = Math.min(maxLineWidth, el.scrollWidth)

  document.body.removeChild(el)

  return { lineCount, contentWidth, contentHeight, fontSize }
}

function innerTextWidth(stoneWidth: number): number {
  return stoneWidth - TEXT_INSET_X
}

/** Usable text band inside the stone silhouette. */
function innerTextHeight(stoneHeight: number): number {
  return (SHAPE_VISIBLE_H / VIEWBOX_H) * stoneHeight * TEXT_BAND_RATIO
}

function fitsInStone(
  text: string,
  stoneWidth: number,
  stoneHeight: number,
  fontSize: number
): boolean {
  const block = measureTextBlock(text, innerTextWidth(stoneWidth), fontSize)
  return (
    block.contentHeight <= innerTextHeight(stoneHeight) + 1 &&
    block.contentWidth <= innerTextWidth(stoneWidth) + 1
  )
}

function scaleFromContent(block: MeasuredTextBlock, stoneW: number, stoneH: number): number {
  const innerW = innerTextWidth(stoneW)
  const innerH = innerTextHeight(stoneH)

  const fromMeasure = Math.max(
    block.contentHeight / innerH,
    block.contentWidth / innerW
  )

  const fromLines =
    block.lineCount <= 1
      ? MIN_SCALE
      : MIN_SCALE + (block.lineCount - 1) * LINE_SCALE_STEP

  return Math.max(MIN_SCALE, fromMeasure, fromLines)
}

/**
 * Derive stone dimensions from task text.
 * scaleFactor is floored at MIN_SCALE (default size is minimum).
 */
export function getStoneDimensions(
  text: string,
  options?: { viewportScale?: number; expanded?: boolean }
): StoneDimensions {
  const viewportScale = options?.viewportScale ?? 1
  const trimmed = text.trim() || " "

  const maxLineWidth = innerTextWidth(STONE_W)

  for (const fontSize of FONT_STEPS) {
    const block = measureTextBlock(trimmed, maxLineWidth, fontSize)

    let scaleFactor = scaleFromContent(block, STONE_W, STONE_H)
    scaleFactor = Math.min(scaleFactor, MAX_SCALE)

    const width = STONE_W * scaleFactor * viewportScale
    const height = STONE_H * scaleFactor * viewportScale

    if (fitsInStone(trimmed, width / viewportScale, height / viewportScale, fontSize)) {
      return {
        width,
        height,
        scaleFactor,
        fontSize,
        lineCount: block.lineCount,
      }
    }
  }

  const fontSize = FONT_STEPS[FONT_STEPS.length - 1]
  const block = measureTextBlock(trimmed, innerTextWidth(STONE_W * MAX_SCALE), fontSize)
  return {
    width: STONE_W * MAX_SCALE * viewportScale,
    height: STONE_H * MAX_SCALE * viewportScale,
    scaleFactor: MAX_SCALE,
    fontSize,
    lineCount: block.lineCount,
  }
}

/** Bucket scale for archive mini-towers (readable at tiny sizes). */
export function getArchiveStoneSize(scaleFactor: number, stackIndex: number): number {
  const base = Math.max(24, 40 - stackIndex * 2)
  if (scaleFactor >= 1.25) return Math.round(base * 1.15)
  if (scaleFactor >= 1.1) return Math.round(base * 1.08)
  return base
}
