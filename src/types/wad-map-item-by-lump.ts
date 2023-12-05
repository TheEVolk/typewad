import WadMapLump from "./wad-map-lump.enum";
import { IWadMapThing, IWadMapLinedef, IWadMapSidedef, IWadMapVertex, IWadMapSegment, IWadMapSubsector, IWadMapNode, IWadMapSector } from "./wad-map-lump.interface";

type WadMapItemsByLump<T extends WadMapLump> = {
  [WadMapLump.Things]: IWadMapThing;
  [WadMapLump.Linedefs]: IWadMapLinedef,
  [WadMapLump.SideDefs]: IWadMapSidedef,
  [WadMapLump.Vertexes]: IWadMapVertex,
  [WadMapLump.Seags]: IWadMapSegment,
  [WadMapLump.Ssectors]: IWadMapSubsector,
  [WadMapLump.Nodes]: IWadMapNode,
  [WadMapLump.Sectors]: IWadMapSector,
  [WadMapLump.Reject]: any,
  [WadMapLump.Blockmap]: any
}[T];

export default WadMapItemsByLump;
