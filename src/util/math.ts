export function pointOnSegmentSide(px: number, py: number, sx: number, sy: number, ex: number, ey: number): number {
  const dotProduct = (px - sx) * (ex - sx) + (py - sy) * (ey - sy);
  if (dotProduct < 0 || dotProduct > ((ex - sx) ** 2 + (ey - sy) ** 2)) {
    return -1; // Point is outside the line segment
  }

  const result = (ex - sx) * (py - sy) - (ey - sy) * (px - sx);
  return result > 0 ? 0 : 1; // Returns side 0 or 1
}
