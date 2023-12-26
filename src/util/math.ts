export function pointOnSegmentSide(px: number, py: number, sx: number, sy: number, ex: number, ey: number): number {
  const dotProduct = (px - sx) * (ex - sx) + (py - sy) * (ey - sy);
  if (dotProduct < 0 || dotProduct > ((ex - sx) ** 2 + (ey - sy) ** 2)) {
    return -1; // Point is outside the line segment
  }

  const result = (ex - sx) * (py - sy) - (ey - sy) * (px - sx);
  return result > 0 ? 0 : 1; // Returns side 0 or 1
}

export function distance(sx: number, sy: number, ex: number, ey: number): number {
  return Math.sqrt(Math.pow(ex - sx, 2) + Math.pow(ey - sy, 2));
}

export function interceptSegmentAndCicle(sx: number, sy: number, ex: number, ey: number, x: number, y: number, radius: number): number {
  let dx = ex - sx;
  let dy = ey - sy;

  let segmentLengthSquared = dx * dx + dy * dy;

  let t = ((x - sx) * dx + (y - sy) * dy) / segmentLengthSquared;

  if (t < 0) {
    const distance = distanceSquared(x, y, sx, sy);
    return distance <= radius * radius ? distance : -1;
  }

  if (t > 1) {
    const distance = distanceSquared(x, y, ex, ey);
    return distance <= radius * radius ? distance : -1;
  }

  // The closest point is on the segment

  let closestX = sx + t * dx;
  let closestY = sy + t * dy;

  const distance = distanceSquared(x, y, closestX, closestY);
  return distance <= radius * radius ? distance : -1;
}

function distanceSquared(x1: number, y1: number, x2: number, y2: number): number {
  let dx = x2 - x1;
  let dy = y2 - y1;

  return dx * dx + dy * dy;
}
