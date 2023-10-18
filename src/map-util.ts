import { NF_SUBSECTOR } from "./const";
import WadMap from "./map";
import IWadMapNode from "./types/wad-map-node.interface";

export default class MapUtil {
    public constructor(private readonly map: WadMap) {
    }

    /** Traverse BSP (sub) tree, check point against partition plane.
    * @returns false (front) true (back).
    **/
    public pointOnSide(x: number, y: number, node: IWadMapNode) {
        if (!node.deltaX) {
            return x <= node.x ? (node.deltaY > 0) : (node.deltaY < 0);
        }

        if (!node.deltaY) {
            return y <= node.y ? (node.deltaX < 0) : (node.deltaX > 0);
        }

        const dx = (x - node.x);
        const dy = (y - node.y);

        // Try to quickly decide by looking at sign bits.
        if ((node.deltaY ^ node.deltaX ^ dx ^ dy) & 0x80000000) {
            if ((node.deltaY ^ dx) & 0x80000000) {
                // (left is negative)
                return true;
            }

            return false;
        }

        const left = node.deltaY * dx;
        const right = dy * node.deltaX;

        if (right < left) {
            // front side
            return false;
        }
        // back side
        return true;
    }

    public pointInSubsector(x: number, y: number) {
        let index = this.map.nodes.length - 1;

        while (!(index & NF_SUBSECTOR)) {
            const node = this.map.nodes[index];
            index = this.pointOnSide(x, y, node) ? node.leftChild : node.rightChild;
        }

        return this.map.subsectors[index & ~NF_SUBSECTOR];
    }

    public pointInSector(x: number, y: number) {
        const subsector = this.pointInSubsector(x, y);
        const segment = this.map.segments[subsector.firstSegment];
        const linedef = this.map.linedefs[segment.linedef];
        const sidedef = this.map.sidedefs[segment.isSameDirection ? linedef.rightSidedef : linedef.leftSidedef];
        return this.map.sectors[sidedef.sector];
    }
}
