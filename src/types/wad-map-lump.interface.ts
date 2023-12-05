export interface IWadMapNode {
  // partition line
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;

  // bbox
  rightBbox: number[];
  leftBbox: number[];

  rightChild: number;
  leftChild: number;
}

export interface IWadMapSector {
  floor: number;
  ceil: number;
  floorFlat: string;
  ceilFlat: string;
  light: number;
  type: number;
  tag: number;
}

export interface IWadMapSegment {
  startVertex: number;
  endVertex: number;
  angle: number;
  linedef: number;
  isSameDirection: boolean;
  linedefToSeqOffset: number;
}

export interface IWadMapSubsector {
  count: number;
  firstSegment: number;
}

export interface IWadMapThing {
  x: number;
  y: number;
  angle: number;
  type: number;
  flags: number;
}

export interface IWadMapVertex {
  x: number;
  y: number;
}

export class IWadMapSidedef {
  offsetX: number;
  offsetY: number;
  upper: string;
  lower: string;
  middle: string;
  sector: number;
}

export interface IWadMapLinedef {
  startVertex: number;
  endVertex: number;
  flags: number;
  lineType: number;
  sectorTag: number;

  /** front */
  rightSidedef: number;

  /** back */
  leftSidedef: number;
}

