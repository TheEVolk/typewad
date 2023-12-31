import WadMapLump from './types/wad-map-lump.enum';

export const MAP_ITEM_SIZES: Record<WadMapLump, number> = {
  [WadMapLump.Things]: 10,
  [WadMapLump.Linedefs]: 14,
  [WadMapLump.SideDefs]: 30,
  [WadMapLump.Vertexes]: 4,
  [WadMapLump.Seags]: 12,
  [WadMapLump.Ssectors]: 4,
  [WadMapLump.Nodes]: 28,
  [WadMapLump.Sectors]: 26,
  [WadMapLump.Reject]: 4,
  [WadMapLump.Blockmap]: 16
};

export const NF_SUBSECTOR =	0x8000