export default interface IWadMapNode {
  // partition line
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;

  // bbox
  rightBbox: number[];
  leftBbox: number[];

  rightChild: number;
  leftChild: number;
}