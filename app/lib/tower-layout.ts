import { getStoneShapeByHash, getStackOverlap } from "@/lib/stone-paths"
import { getStoneDimensions, type StoneDimensions } from "@/lib/stone-size"

/** Design-frame width the layout is tuned for (iPhone 14 class). */
export const FRAME_W = 390

export const STONE_W = 160
export const STONE_H = 208
export const STONE_OVERLAP = 72
export const STONE_STEP = STONE_H - STONE_OVERLAP
export const TOWER_PAD_TOP = 48
export const TOWER_PAD_BOTTOM = 0

/** Max rendered stone width on the main frame (includes rotation/offset headroom). */
export const MAX_STONE_RENDER_W = 240

/** Scale stones down on narrow viewports so the tower fits without clipping. */
export function getTowerScale(viewportWidth: number): number {
  const horizontalPad = 16
  return Math.min(1, (viewportWidth - horizontalPad * 2) / FRAME_W)
}

export function getTowerHeight(stoneCount: number, scale = 1): number {
  if (stoneCount <= 0) return 0
  const stoneH = STONE_H * scale
  const step = STONE_STEP * scale
  const padTop = TOWER_PAD_TOP * scale
  const padBottom = TOWER_PAD_BOTTOM * scale
  return padTop + stoneH + (stoneCount - 1) * step + padBottom
}

export interface StackSlot {
  taskId: string
  top: number
  width: number
  height: number
  scaleFactor: number
  fontSize: number
  overlap: number
}

export interface StackLayoutItem {
  id: string
  text: string
}

export function computeStackLayout(
  items: StackLayoutItem[],
  viewportScale = 1
): { slots: StackSlot[]; towerHeight: number } {
  if (items.length === 0) {
    return { slots: [], towerHeight: 0 }
  }

  const padTop = TOWER_PAD_TOP * viewportScale
  const dimensions: StoneDimensions[] = items.map((item) =>
    getStoneDimensions(item.text, { viewportScale })
  )

  const slots: StackSlot[] = []
  let top = padTop

  for (let i = 0; i < items.length; i++) {
    const dim = dimensions[i]
    let overlap = 0

    if (i < items.length - 1) {
      const aboveShape = getStoneShapeByHash(items[i].id)
      const belowShape = getStoneShapeByHash(items[i + 1].id)
      overlap = getStackOverlap(aboveShape, belowShape, dim.height)
    }

    slots.push({
      taskId: items[i].id,
      top,
      width: dim.width,
      height: dim.height,
      scaleFactor: dim.scaleFactor,
      fontSize: dim.fontSize,
      overlap,
    })

    if (i < items.length - 1) {
      top += dim.height - overlap
    }
  }

  const last = slots[slots.length - 1]
  const towerHeight = last.top + last.height + TOWER_PAD_BOTTOM * viewportScale

  return { slots, towerHeight }
}

/** Check whether a stone would clip past the frame edge (rotation + offset). */
export function stoneWouldClip(
  stoneWidth: number,
  offsetX: number,
  rotationDeg: number,
  frameWidth = FRAME_W
): boolean {
  const half = stoneWidth / 2
  const rad = (rotationDeg * Math.PI) / 180
  const rotatedHalf = Math.abs(half * Math.cos(rad)) + Math.abs(half * Math.sin(rad))
  const extent = rotatedHalf + Math.abs(offsetX) + 8
  return extent * 2 > frameWidth - 32
}
