export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const value = Number.parseInt(clean, 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

export function valueToColor(
  value: number,
  palette: Array<[number, string]>,
  alpha = 225,
): [number, number, number, number] {
  const sorted = [...palette].sort((a, b) => a[0] - b[0])

  if (value <= sorted[0][0]) {
    return [...hexToRgb(sorted[0][1]), alpha]
  }

  for (let i = 1; i < sorted.length; i += 1) {
    const [stopValue, stopColor] = sorted[i]
    const [prevValue, prevColor] = sorted[i - 1]

    if (value <= stopValue) {
      const t = (value - prevValue) / (stopValue - prevValue)
      const from = hexToRgb(prevColor)
      const to = hexToRgb(stopColor)
      return [
        Math.round(from[0] + (to[0] - from[0]) * t),
        Math.round(from[1] + (to[1] - from[1]) * t),
        Math.round(from[2] + (to[2] - from[2]) * t),
        alpha,
      ]
    }
  }

  return [...hexToRgb(sorted[sorted.length - 1][1]), alpha]
}

export function valueToSteppedColor(
  value: number,
  palette: Array<[number, string]>,
  alpha = 235,
): [number, number, number, number] {
  const sorted = [...palette].sort((a, b) => a[0] - b[0])
  let color = sorted[0][1]

  for (const [stopValue, stopColor] of sorted) {
    if (value >= stopValue) {
      color = stopColor
    }
  }

  return [...hexToRgb(color), alpha]
}

export function rgbaToCss([red, green, blue, alpha]: [number, number, number, number]) {
  return `rgba(${red}, ${green}, ${blue}, ${alpha / 255})`
}
