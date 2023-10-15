import WadMap from "./map";
import IWadMapLinedef from "./types/wad-map-linedef.interface";
import WadMapLump from "./types/wad-map-lump.enum";
import IWadMapSector from "./types/wad-map-sector.interface";
import IWadMapSidedef from "./types/waf-map-sidedef.interface";
import cdt2d from 'cdt2d';
import cleanPSLG from 'clean-pslg';

export default class MapMeshBuilder {
  private sidedefs: IWadMapSidedef[];
  private sectors: IWadMapSector[];
  private vertexes: any[];

  public constructor(private readonly map: WadMap) {
    this.sidedefs = [...map.get(WadMapLump.SideDefs)];
    this.sectors = [...map.get(WadMapLump.Sectors)];
    this.vertexes = [...map.get(WadMapLump.Vertexes)];
  }

  public createWallSurfaces(linedef: IWadMapLinedef) {
    const rightSide = this.sidedefs[linedef.rightSidedef];
    const rightSector = rightSide && this.sectors[rightSide.sector];
    const leftSide = this.sidedefs[linedef.leftSidedef];
    const leftSector = leftSide && this.sectors[leftSide.sector];

    let leftSurfaces = null;
    if (leftSide) {
      leftSurfaces = this.createWallLeftSurface(linedef, leftSide, leftSector, rightSector);
    }

    let rightSurfaces = null;
    if (rightSide) {
      rightSurfaces = this.createWallRightSurface(linedef, rightSide, rightSector, leftSector);
    }

    return [
      leftSurfaces,
      rightSurfaces
    ];
  }

  public createWallLeftSurface(linedef: IWadMapLinedef, leftSide: IWadMapSidedef, leftSector: IWadMapSector, rightSector: IWadMapSector) {
    let lower = null;
    if (leftSide.lower !== '-') {
      lower = this.createWallMesh(linedef, leftSector.floor, rightSector.floor);
    }

    let middle = null;
    if (leftSide.middle !== '-') {
      middle = this.createWallMesh(linedef, leftSector.floor, leftSector.ceil);
    }

    let upper = null;
    if (leftSide.upper !== '-') {
      // TODO: ???
      upper = this.createWallMesh(linedef, leftSector.ceil, leftSector.ceil);
    }

    return [lower, middle, upper];
  }

  public createWallRightSurface(linedef: IWadMapLinedef, rightSide: IWadMapSidedef, rightSector: IWadMapSector, leftSector?: IWadMapSector) {
    let lower = null;
    if (rightSide.lower !== '-') {
      lower = this.createWallMesh(linedef, rightSector.floor, leftSector?.floor || 0);
    }

    let middle = null;
    if (rightSide.middle !== '-') {
      middle = this.createWallMesh(linedef, rightSector.floor, rightSector.ceil);
    }

    let upper = null;
    if (rightSide.upper !== '-') {
      upper = this.createWallMesh(linedef, leftSector?.ceil || 0, rightSector.ceil);
    }

    return [lower, middle, upper];
  }

  public createWallMesh(linedef: IWadMapLinedef, floor: number, ceil: number) {
    const startVertex = this.vertexes[linedef.startVertex];
    const endVertex = this.vertexes[linedef.endVertex];

    return {
      positions: [
        startVertex.x, ceil, startVertex.y,
        endVertex.x, floor, endVertex.y,
        startVertex.x, floor, startVertex.y,
        endVertex.x, ceil, endVertex.y
      ],
      indices: [1, 2, 0, 3, 1, 0],
      normals: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
      uvs: [0, 0, 1, 1, 0, 1, 1, 0],
    };
  }

  public *horizontalSurfaces(surfacesVertexes?: any[][]) {
    if (!surfacesVertexes) {
      surfacesVertexes = this.map.groupVertexesBySector();
    }

    for (let i = 0; i < surfacesVertexes.length; i++) {
      const vertexes = surfacesVertexes[i];
      if (!vertexes.length) {
        continue;
      }

      yield this.buildHorizontalSurface(vertexes);
    }
  }

  private buildHorizontalSurface(vertexes) {
    const points = vertexes.map(({ x, y }) => [x, y]);
    const edges = Array.from({ length: points.length / 2 }, (_, i) => [i * 2, i * 2 + 1]);

    cleanPSLG(points, edges);
    const triangles = cdt2d(points, edges, { exterior: false });
    return {
      positions: points.flatMap(v => [v[0], 0, v[1]]),
      indices: triangles.flat(),
    };
  }
}