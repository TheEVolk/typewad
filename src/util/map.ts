import { NF_SUBSECTOR } from "src/const";
import WadMap from "src/map";
import { IWadMapLinedef, IWadMapNode, IWadMapSegment, IWadMapVertex } from "src/types/wad-map-lump.interface";
import { distance, interceptSegmentAndCicle, pointOnSegmentSide } from "./math";

export type SegmentsBySubsector = Record<number, number[]>;

export interface IRaycastResult {
  segment: IWadMapSegment;
  segmentId: number;
  px: number;
  py: number;
  distance: number;
}

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

export function *interceptSegments(map: WadMap, x: number, y: number, radius: number) {
  for (let i = 0; i < map.segments.length; i++) {
    const segment = map.segments[i];
    const startPoint = map.vertexes[segment.startVertex];
    const endPoint = map.vertexes[segment.endVertex];

    const distance = interceptSegmentAndCicle(startPoint.x, startPoint.y, endPoint.x, endPoint.y, x, y, radius);
    if (distance === -1) {
      continue;
    }

    yield [i, distance];
  }
}

export function raycastSegments(map: WadMap, x: number, y: number, dirx: number, diry: number, maxDistance = 128) {
  let response: IRaycastResult = null;
  for (let i = 0; i < map.segments.length; i++) {
    const segment = map.segments[i];
    const startPoint = map.vertexes[segment.startVertex];
    const endPoint = map.vertexes[segment.endVertex];

    if (!segment.isSameDirection) {
      // continue;
    }

    const result = segment.isSameDirection ? raycastVertexes(x, y, dirx, diry, startPoint, endPoint) : raycastVertexes(x, y, dirx, diry, endPoint, startPoint);
    if (!result) {
      continue; 
    }

    const resultDistance = distance(x, y, result[0], result[1]);
    if (resultDistance > maxDistance) {
      continue;
    }

    if (response && resultDistance > response.distance) {
      continue;
    }

    response = {
      segment,
      segmentId: i,
      px: result[0],
      py: result[1],
      distance: resultDistance,
    };
  }

  return response;
}

export function raycastVertexes(x: number, y: number, dx: number, dy: number, startPoint: IWadMapVertex, endPoint: IWadMapVertex) {
  const den = (startPoint.x - endPoint.x) * (y - dy) - (startPoint.y - endPoint.y) * (x - dx);
  if (den == 0) {
    return;
  }

  const t = ((startPoint.x - x) * (y - dy) - (startPoint.y - y) * (x - dx)) / den;
  const u = -((startPoint.x - endPoint.x) * (startPoint.y - y) - (startPoint.y - endPoint.y) * (startPoint.x - x)) / den;
  if (t > 0 && t < 1 && u > 0) {
    return [startPoint.x + t * (endPoint.x - startPoint.x), startPoint.y + t * (endPoint.y - startPoint.y)];
  }
}