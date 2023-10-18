import WadMapItemByLump from "./types/wad-map-item-by-lump";
import IWadMapLinedef from "./types/wad-map-linedef.interface";
import WadMapLump from "./types/wad-map-lump.enum";
import IWadMapNode from "./types/wad-map-node.interface";
import IWadMapSector from "./types/wad-map-sector.interface";
import IWadMapSegment from "./types/wad-map-segment.interface";
import IWadMapSubsector from "./types/wad-map-subsector.interface";
import { readString } from "./util";

// TODO: refactor typescript types
const mapMappers = {
  [WadMapLump.Things]: (buffer: Buffer, offset: number) => ({
    x: buffer.readInt16LE(offset),
    y: buffer.readInt16LE(offset + 2),
    angle: buffer.readUInt16LE(offset + 4),
    type: buffer.readUInt16LE(offset + 6),
    flags: buffer.readUInt16LE(offset + 8)
  }) as WadMapItemByLump<WadMapLump.Things>,
  [WadMapLump.Linedefs]: (buffer: Buffer, offset: number) => ({
    startVertex: buffer.readInt16LE(offset),
    endVertex: buffer.readInt16LE(offset + 2),
    flags: buffer.readInt16LE(offset + 4),
    lineType: buffer.readInt16LE(offset + 6),
    sectorTag: buffer.readInt16LE(offset + 8),
    rightSidedef: buffer.readInt16LE(offset + 10),
    leftSidedef: buffer.readInt16LE(offset + 12),
  }) as IWadMapLinedef,
  [WadMapLump.SideDefs]: (buffer: Buffer, offset: number) => ({
    offsetX: buffer.readInt16LE(offset),
    offsetY: buffer.readInt16LE(offset + 2),
    upper: readString(buffer, offset + 4),
    lower: readString(buffer, offset + 12),
    middle: readString(buffer, offset + 20),
    sector: buffer.readInt16LE(offset + 28),
  }),
  [WadMapLump.Vertexes]: (buffer: Buffer, offset: number) => ({
    x: buffer.readInt16LE(offset),
    y: buffer.readInt16LE(offset + 2),
  }) as WadMapItemByLump<WadMapLump.Vertexes>,
  [WadMapLump.Seags]: (buffer: Buffer, offset: number) => ({
    startVertex: buffer.readUInt16LE(offset),
    endVertex: buffer.readUInt16LE(offset + 2),
    angle: buffer.readInt16LE(offset + 4),
    linedef: buffer.readUInt16LE(offset + 6),
    isSameDirection: buffer.readUInt16LE(offset + 8) === 0,
    linedefToSeqOffset: buffer.readUInt16LE(offset + 10),
  }) as IWadMapSegment,
  [WadMapLump.Ssectors]: (buffer: Buffer, offset: number) => ({
    count: buffer.readUInt16LE(offset),
    firstSegment: buffer.readUInt16LE(offset + 2),
  }) as IWadMapSubsector,
  [WadMapLump.Nodes]: (buffer: Buffer, offset: number) => ({
    x: buffer.readInt16LE(offset),
    y: buffer.readInt16LE(offset + 2),
    deltaX: buffer.readInt16LE(offset + 4),
    deltaY: buffer.readInt16LE(offset + 6),
    rightBbox: [
      buffer.readInt16LE(offset + 8),
      buffer.readInt16LE(offset + 10),
      buffer.readInt16LE(offset + 12),
      buffer.readInt16LE(offset + 14),
    ],
    leftBbox: [
      buffer.readInt16LE(offset + 16),
      buffer.readInt16LE(offset + 18),
      buffer.readInt16LE(offset + 20),
      buffer.readInt16LE(offset + 22),
    ],
    rightChild: buffer.readUInt16LE(offset + 24),
    leftChild: buffer.readUInt16LE(offset + 26),
  }) as IWadMapNode,
  [WadMapLump.Sectors]: (buffer: Buffer, offset: number) => ({
    floor: buffer.readInt16LE(offset),
    ceil: buffer.readInt16LE(offset + 2),
    floorFlat: readString(buffer, offset + 4),
    ceilFlat: readString(buffer, offset + 12),
    light: buffer.readInt16LE(offset + 20),
    type: buffer.readInt16LE(offset + 22),
    tag: buffer.readInt16LE(offset + 24),
  }) as IWadMapSector,
  [WadMapLump.Reject]: (buffer: Buffer, offset: number): WadMapItemByLump<WadMapLump.Reject> => { throw new Error("Function not implemented."); },
  [WadMapLump.Blockmap]: (buffer: Buffer, offset: number): WadMapItemByLump<WadMapLump.Blockmap> => { throw new Error("Function not implemented."); }
};

export default mapMappers;
