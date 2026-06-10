/** Design-frame width the layout is tuned for (iPhone 14 class). */
export const FRAME_W = 390

export const STONE_W = 160
export const STONE_H = 208
export const STONE_OVERLAP = 72
export const STONE_STEP = STONE_H - STONE_OVERLAP
export const TOWER_PAD_TOP = 48
export const TOWER_PAD_BOTTOM = 0

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
