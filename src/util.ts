export function readString(buffer: Buffer, offset: number, size = 8) {
  let nullTerminatorIndex = buffer.indexOf(0, offset);
  if (nullTerminatorIndex < 0) {
    return buffer.toString('utf-8', offset, offset + size);
  }

  return buffer.toString('utf-8', offset, Math.min(offset + size, nullTerminatorIndex));
}

export function distance(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt(
    Math.pow(x1 - x2, 2) - Math.pow(y1 - y2, 2)
  );
}

export function rawDistance(x1: number, y1: number, x2: number, y2: number) {
  return Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2);
}

export function rawLineDistance(pointX: number, pointY: number, startX: number, startY: number, endX: number, endY: number) {
  const dx = endX - startX;
  const dy = endY - startY;
  const l2 = dx * dx + dy * dy;
        
  if (l2 === 0) {
    return rawDistance(pointX, pointY, startX, startY);
  }

  let t = ((pointX - startX) * dx + (pointY - startY) * dy) / l2;
  t = Math.max(0, Math.min(1, t));

  return rawDistance(pointX, pointY, startX + t * dx, startY + t * dy);
}
