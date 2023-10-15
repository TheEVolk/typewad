import WadMapLump from './types/wad-map-lump.enum';

export const MAP_ITEM_SIZES: Record<WadMapLump, number> = {
  [WadMapLump.Things]: 10,
  [WadMapLump.Linedefs]: 14,
  [WadMapLump.SideDefs]: 30,
  [WadMapLump.Vertexes]: 4,
  [WadMapLump.Seags]: 2,
  [WadMapLump.Ssectors]: 8,
  [WadMapLump.Nodes]: 28,
  [WadMapLump.Sectors]: 26,
  [WadMapLump.Reject]: 4,
  [WadMapLump.Blockmap]: 16
};
