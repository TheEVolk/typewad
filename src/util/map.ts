import { NF_SUBSECTOR } from "src/const";
import WadMap from "src/map";
import { IWadMapNode, IWadMapSegment } from "src/types/wad-map-lump.interface";
import { pointOnSegmentSide } from "./math";

export type SegmentsBySubsector = Record<number, number[]>;

export function computeSegmentsBySubsector(map: WadMap): SegmentsBySubsector {
  return map.subsectors.map((subsector) => Array.from({ length: subsector.count }).map((_, i) => subsector.firstSegment + i));
}

/** @returns 1 - front of segment, 0 - back of segment, -1 out of segment */
export function getPointSideOnSegment(map: WadMap, segmentId: number, x: number, y: number): number {
  const segment = map.segments[segmentId];
  const startPoint = map.vertexes[segment.startVertex];
  const endPoint = map.vertexes[segment.endVertex];

  let side = pointOnSegmentSide(x, y, startPoint.x, startPoint.y, endPoint.x, endPoint.y);
  if (side === -1) {
    return -1;
  }

  return side;
  //return segment.isSameDirection ? side : (1 - side);
}

/** @returns subsector id */
export function pointInSubsector(map: WadMap, x: number, y: number): number {
  let index = map.nodes.length - 1;
  while (!(index & NF_SUBSECTOR)) {
    const node = map.nodes[index];
    index = pointOnSide(x, y, node) ? node.leftChild : node.rightChild;
  }

  return index & ~NF_SUBSECTOR;
}

/** Traverse BSP (sub) tree, check point against partition plane.
    * @returns false (front) true (back).
    **/
export function pointOnSide(x: number, y: number, node: IWadMapNode) {
  if (!node.deltaX) {
      return x <= node.x ? (node.deltaY > 0) : (node.deltaY < 0);
  }

  if (!node.deltaY) {
      return y <= node.y ? (node.deltaX < 0) : (node.deltaX > 0);
  }

  const dx = (x - node.x);
  const dy = (y - node.y);

  // Try to quickly decide by looking at sign bits.
  if ((node.deltaY ^ node.deltaX ^ dx ^ dy) & 0x80000000) {
      if ((node.deltaY ^ dx) & 0x80000000) {
          // (left is negative)
          return true;
      }

      return false;
  }

  const left = node.deltaY * dx;
  const right = dy * node.deltaX;

  if (right < left) {
      // front side
      return false;
  }
  // back side
  return true;
}
