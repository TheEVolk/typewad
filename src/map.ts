import WadMapLump from "./types/wad-map-lump.enum";
import WadReader from "./reader";
import { MAP_ITEM_SIZES } from "./const";
import mapMappers from "./map-mappers";
import WadMapItemByLump from "./types/wad-map-item-by-lump";

export default class WadMap {
  private readonly offset: number;

  public constructor(private readonly reader: WadReader, id: number | string) {
    this.offset = typeof id === 'number' ? id : this.reader.findLumpIndex(id);
  }

  public groupVertexesBySector() {
    const { count } = this.getLumpInfo(WadMapLump.Sectors);
    const result = Array.from({ length: count }, () => []);
   
    const vertexes = [...this.get(WadMapLump.Vertexes)];
    const sidedefs = [...this.get(WadMapLump.SideDefs)];

    const processSidedef = (index: number, startVertex, endVertex) => {
      if (index < 0) {
        return;
      }

      const sidedef = sidedefs[index];
      result[sidedef.sector].push(startVertex, endVertex);
    };

    for (const linedef of this.get(WadMapLump.Linedefs)) {
      const startVertex = vertexes[linedef.startVertex];
      const endVertex = vertexes[linedef.endVertex];

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
    const buffer = this.reader.buffer;
    const mapper = mapMappers[indice];
    for (let i = index; i < info.count; i++) {
      yield mapper(buffer, info.offset + i * MAP_ITEM_SIZES[indice]);
    }
  }

  private getLumpInfo(indice: WadMapLump) {
    const { offset, size } = this.reader.lumps[this.offset + indice];
    return {
      size,
      offset,
      count: size / MAP_ITEM_SIZES[indice]
    };
  }
}
