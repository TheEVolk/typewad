import IWadMapLinedef from "./wad-map-linedef.interface";
import WadMapLump from "./wad-map-lump.enum";
import IWadMapThing from "./wad-map-thing.interface";
import IWadMapSidedef from "./waf-map-sidedef.interface";
// import IWadMapLinedef from "./wad-map-linedef.interface";

// typescript get type by enum
type WadMapItemsByLump = {
  [WadMapLump.Things]: IWadMapThing;
  [WadMapLump.Linedefs]: IWadMapLinedef,
  [WadMapLump.SideDefs]: IWadMapSidedef,
    [WadMapLump.Vertexes]: any,
      [WadMapLump.Seags]: any,
        [WadMapLump.Ssectors]: any,
          [WadMapLump.Nodes]: any,
            [WadMapLump.Sectors]: any,
  [WadMapLump.Reject]: any,
    [WadMapLump.Blockmap]: any
};

type WadMapItemByLump<T extends WadMapLump> = WadMapItemsByLump[T];

export default WadMapItemByLump;
