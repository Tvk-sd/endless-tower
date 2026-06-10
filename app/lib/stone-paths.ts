// Angular, irregular SVG paths that sit in the vertical center of a tall
// viewBox so that negative-margin stacking makes outlines *touch* without
// the shapes intersecting. Each shape occupies roughly y 40-220 inside a
// 200x260 canvas, leaving ~40px transparent above and below.

export interface StonePath {
  viewBox: string
  path: string
  // The approximate y-extent of the visible shape inside the viewBox.
  // Used to calculate the exact overlap needed so outlines just touch.
  topY: number   // smallest y in the path
  bottomY: number // largest y in the path
}

// 10 distinct angular stone shapes
export const STONE_PATHS: StonePath[] = [
  {
    viewBox: "0 0 200 260",
    path: "M72,48 L138,52 L172,68 L192,108 L188,158 L168,192 L132,212 L78,216 L38,198 L12,160 L8,112 L28,72 Z",
    topY: 48, bottomY: 216,
  },
  {
    viewBox: "0 0 200 260",
    path: "M82,46 L148,54 L186,88 L192,148 L172,196 L118,214 L58,208 L18,178 L8,122 L32,72 Z",
    topY: 46, bottomY: 214,
  },
  {
    viewBox: "0 0 200 260",
    path: "M68,50 L118,46 L162,58 L188,92 L194,138 L182,182 L158,208 L108,216 L52,212 L18,188 L6,142 L12,92 L38,62 Z",
    topY: 46, bottomY: 216,
  },
  {
    viewBox: "0 0 200 260",
    path: "M58,52 L132,48 L172,62 L194,102 L192,152 L178,188 L142,212 L88,216 L38,202 L10,168 L6,118 L22,78 Z",
    topY: 48, bottomY: 216,
  },
  {
    viewBox: "0 0 200 260",
    path: "M92,46 L152,56 L184,82 L194,128 L186,172 L162,202 L112,216 L62,212 L24,188 L8,148 L12,98 L42,62 Z",
    topY: 46, bottomY: 216,
  },
  {
    viewBox: "0 0 200 260",
    path: "M88,48 L142,52 L178,78 L194,118 L188,168 L164,200 L122,216 L72,214 L32,192 L10,152 L8,102 L32,68 Z",
    topY: 48, bottomY: 216,
  },
  {
    viewBox: "0 0 200 260",
    path: "M62,50 L142,48 L178,68 L196,112 L192,162 L172,196 L128,214 L68,216 L28,198 L8,158 L6,108 L28,68 Z",
    topY: 48, bottomY: 216,
  },
  {
    viewBox: "0 0 200 260",
    path: "M78,48 L138,46 L174,66 L194,108 L190,158 L172,192 L132,214 L82,216 L38,202 L12,168 L6,122 L22,78 Z",
    topY: 46, bottomY: 216,
  },
  {
    viewBox: "0 0 200 260",
    path: "M86,46 L148,52 L182,76 L196,122 L190,172 L168,202 L118,218 L62,214 L22,188 L6,142 L10,92 L42,60 Z",
    topY: 46, bottomY: 218,
  },
  {
    viewBox: "0 0 200 260",
    path: "M72,48 L128,46 L168,62 L192,98 L196,148 L178,188 L142,212 L92,218 L42,204 L14,168 L6,118 L28,72 Z",
    topY: 46, bottomY: 218,
  },
]

// Completion fill palette
export const COMPLETION_COLORS = [
  "#2B5A2B", // dark green
  "#3B5BDB", // cobalt blue
  "#1B3A6B", // dark navy
  "#5B7A3A", // olive
  "#4A6B8A", // steel blue
]

export function getCompletionColor(id: string): string {
  const hash = hashString(id)
  return COMPLETION_COLORS[hash % COMPLETION_COLORS.length]
}

// Deterministic hash from a string (task id)
export function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash)
}

export function getStoneShapeByHash(id: string): StonePath {
  const hash = hashString(id)
  return STONE_PATHS[hash % STONE_PATHS.length]
}

// Random rotation & x-offset seeded by task id
export function getStoneTransform(id: string): { rotation: number; offsetX: number } {
  const hash = hashString(id)
  const rotation = ((hash % 17) - 8) // -8 to +8 degrees
  const offsetX = ((hash >> 4) % 21) - 10 // -10 to +10 px
  return { rotation, offsetX }
}

export function getStoneShape(index: number): StonePath {
  return STONE_PATHS[index % STONE_PATHS.length]
}

// Calculate the exact negative margin so stone outlines just touch.
// Takes the shape above and the shape below and returns the overlap px
// scaled from viewBox coordinates to render size.
export function getStackOverlap(
  aboveShape: StonePath,
  belowShape: StonePath,
  renderHeight: number,
): number {
  const viewBoxH = 260
  const scale = renderHeight / viewBoxH
  // Transparent space below the upper stone
  const abovePadBottom = viewBoxH - aboveShape.bottomY
  // Transparent space above the lower stone
  const belowPadTop = belowShape.topY
  // Overlap = sum of the two transparent pads, plus a small touch buffer
  return Math.round((abovePadBottom + belowPadTop) * scale) + 2
}
