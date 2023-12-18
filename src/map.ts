import WadMapLump from "./types/wad-map-lump.enum";
import WadReader from "./reader";
import { MAP_ITEM_SIZES } from "./const";
import mapMappers from "./map-mappers";
import WadMapItemByLump from "./types/wad-map-item-by-lump";
import MapUtil from "./map-util";
import { IWadMapVertex, IWadMapLinedef, IWadMapSidedef, IWadMapSector, IWadMapSubsector, IWadMapNode, IWadMapSegment } from "./types/wad-map-lump.interface";

export default class WadMap {
  private readonly offset: number;
  public readonly vertexes: IWadMapVertex[];
  public readonly linedefs: IWadMapLinedef[];
  public readonly sidedefs: IWadMapSidedef[];
  public readonly sectors: IWadMapSector[];
  public readonly subsectors: IWadMapSubsector[];
  public readonly nodes: IWadMapNode[];
  public readonly segments: IWadMapSegment[];
  public readonly util: MapUtil;

  public constructor(private readonly reader: WadReader, id: number | string) {
    this.offset = typeof id === 'number' ? id : this.reader.findLumpIndex(id);
    this.vertexes = [...this.get(WadMapLump.Vertexes)];
    this.linedefs = [...this.get(WadMapLump.Linedefs)];
    this.sidedefs = [...this.get(WadMapLump.SideDefs)];
    this.sectors = [...this.get(WadMapLump.Sectors)];
    this.subsectors = [...this.get(WadMapLump.Ssectors)];
    this.nodes = [...this.get(WadMapLump.Nodes)];
    this.segments = [...this.get(WadMapLump.Seags)];

    this.util = new MapUtil(this);
  }

  public groupVertexesBySector() {
    const { count } = this.getLumpInfo(WadMapLump.Sectors);
    const result = Array.from({ length: count }, () => []);

    const processSidedef = (index: number, startVertex: IWadMapVertex, endVertex: IWadMapVertex) => {
      if (index < 0) {
        return;
      }

      const sidedef = this.sidedefs[index];
      result[sidedef.sector].push(startVertex, endVertex);
    };

    for (const linedef of this.get(WadMapLump.Linedefs)) {
      const startVertex = this.vertexes[linedef.startVertex];
      const endVertex = this.vertexes[linedef.endVertex];

      processSidedef(linedef.leftSidedef, startVertex, endVertex);
      processSidedef(linedef.rightSidedef, startVertex, endVertex);
    }

    return result;
  }

  public *get<T extends WadMapLump>(
    indice: T,
    index = 0,
  ): Generator<WadMapItemByLump<T>> {
    const info = this.getLumpInfo(indice);
    const mapper = mapMappers[indice];
    
    for (let i = index; i < info.count; i++) {
      yield mapper(this.reader.buffer, info.offset + i * MAP_ITEM_SIZES[indice]);
    }
  }

  private getLumpInfo(indice: WadMapLump) {
    const { offset, size } = this.reader.lumps[this.offset + indice];

    const itemSize = MAP_ITEM_SIZES[indice];
    return {
      size,
      offset,
      count: itemSize ? (size / itemSize) : null
    };
  }
}
