export function readString(buffer: Buffer, offset: number, size = 8) {
  let nullTerminatorIndex = buffer.indexOf(0, offset);
  if (nullTerminatorIndex < 0) {
    return buffer.toString('utf-8', offset, offset + size);
  }

  return buffer.toString('utf-8', offset, Math.min(offset + size, nullTerminatorIndex));
}