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

  public constructor(private readonly map: WadMap, private readonly getTextureSize: (name: string) => [number, number]) {
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
      lower = this.createWallMesh(linedef, leftSector.floor, rightSector.floor, leftSide.lower, leftSide);
    }

    let middle = null;
    if (leftSide.middle !== '-') {
      middle = this.createWallMesh(linedef, leftSector.floor, leftSector.ceil, leftSide.middle, leftSide);
    }

    let upper = null;
    if (leftSide.upper !== '-') {
      // TODO: ???
      upper = this.createWallMesh(linedef, leftSector.ceil, leftSector.ceil, leftSide.upper, leftSide);
    }

    return [lower, middle, upper];
  }

  public createWallRightSurface(linedef: IWadMapLinedef, rightSide: IWadMapSidedef, rightSector: IWadMapSector, leftSector?: IWadMapSector) {
    let lower = null;
    if (rightSide.lower !== '-') {
      lower = this.createWallMesh(linedef, rightSector.floor, leftSector?.floor || 0, rightSide.lower, rightSide);
    }

    let middle = null;
    if (rightSide.middle !== '-') {
      middle = this.createWallMesh(linedef, rightSector.floor, rightSector.ceil, rightSide.middle, rightSide);
    }

    let upper = null;
    if (rightSide.upper !== '-') {
      upper = this.createWallMesh(linedef, leftSector?.ceil || 0, rightSector.ceil, rightSide.upper, rightSide);
    }

    return [lower, middle, upper];
  }

  public createWallMesh(linedef: IWadMapLinedef, floor: number, ceil: number, texture: string, sidedef: IWadMapSidedef) {
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
      uvs: this.buildWallUv(startVertex, endVertex, floor, ceil, texture, sidedef),
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

  private buildWallUv(startVertex, endVertex, floor: number, ceil: number, textureName: string, sidedef: IWadMapSidedef) {
    const textureSize = this.getTextureSize(textureName);
    if (!textureSize) {
      console.warn(`No texture size ${textureName}`);
      return [];
    }

    const height = ceil - floor;	
	  const width = Math.sqrt(Math.pow(startVertex.x - endVertex.x, 2) + Math.pow(startVertex.y - endVertex.y, 2));

    const offsetU = sidedef.offsetX / textureSize[0];
    const offsetV = sidedef.offsetY / textureSize[1];
    const endU = (width / textureSize[0]) + offsetU;
    const endV = (height / textureSize[1]) + offsetV;

    return [offsetU, offsetV, endU, endV, offsetU, endV, endU, offsetV];
  }

  private buildHorizontalSurface(vertexes) {
    const points = vertexes.map(({ x, y }) => [x, y]);
    const edges = Array.from({ length: points.length / 2 }, (_, i) => [i * 2, i * 2 + 1]);

    cleanPSLG(points, edges);
    const triangles = cdt2d(points, edges, { exterior: false });

    return {
      positions: points.flatMap(v => [v[0], 0, v[1]]),
      indices: triangles.flat(),
      uvs: points.flatMap(v => [v[0] / 64, v[1] / 64]),
    };
  }
}
