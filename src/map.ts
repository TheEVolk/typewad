import WadMapLump from "./types/wad-map-lump.enum";
import WadReader from "./reader";
import { MAP_ITEM_SIZES } from "./const";
import mapMappers from "./map-mappers";
import WadMapItemByLump from "./types/wad-map-item-by-lump";
import IWadMapLinedef from "./types/wad-map-linedef.interface";
import IWadMapVertex from "./types/wad-map-vertex.interface";
import IWadMapSidedef from "./types/waf-map-sidedef.interface";
import IWadMapSector from "./types/wad-map-sector.interface";
import { rawLineDistance } from "./util";

export default class WadMap {
  private readonly offset: number;
  public readonly vertexes: IWadMapVertex[];
  private linedefs: IWadMapLinedef[];
  private sidedefs: IWadMapSidedef[];
  private sectors: IWadMapSector[];

  public constructor(private readonly reader: WadReader, id: number | string) {
    this.offset = typeof id === 'number' ? id : this.reader.findLumpIndex(id);
    this.vertexes = [...this.get(WadMapLump.Vertexes)];
    this.linedefs = [...this.get(WadMapLump.Linedefs)];
    this.sidedefs = [...this.get(WadMapLump.SideDefs)];
    this.sectors = [...this.get(WadMapLump.Sectors)];
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

  public getSector(x: number, y: number): IWadMapSector | null {
    const linedef = this.findNearLinedef(x, y);
    const isRight = this.isRightSideFromLinedef(linedef, x, y);
    const sidedef = this.sidedefs[isRight ? linedef.rightSidedef : linedef.leftSidedef];
    if (!sidedef) {
      return null;
    }

    return this.sectors[sidedef.sector];
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

  public findNearLinedef(x: number, z: number): IWadMapLinedef | null {
    let minDistance = Infinity;
    let nearestLinedef: IWadMapLinedef | null = null;

    for (const linedef of this.linedefs) {
      const distance = this.rawDistanceToLinedef(linedef, x, z);

      if (distance < minDistance) {
        minDistance = distance;
        nearestLinedef = linedef;
      }
    }

    if (!nearestLinedef) {
      throw new Error(`Linedefs is null`);
    }

    return nearestLinedef;
  }

  public rawDistanceToLinedef(linedef: IWadMapLinedef, x: number, y: number) {
      const startVertex = this.vertexes[linedef.startVertex];
      const endVertex = this.vertexes[linedef.endVertex];
  
      return rawLineDistance(x, y, startVertex.x, startVertex.y, endVertex.x, endVertex.y);
  }

  private isRightSideFromLinedef(linedef: IWadMapLinedef, x: number, y: number): boolean {
    const startVertex = this.vertexes[linedef.startVertex];
    const endVertex = this.vertexes[linedef.endVertex];

    return (endVertex.x - startVertex.x) * (y - startVertex.y) - (endVertex.y - startVertex.y) * (x - startVertex.x) < 0;
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
