export default interface IWadMapLinedef {
  startVertex: number;
  endVertex: number;
  flags: number;
  lineType: number;
  sectorTag: number;

  /** front */
  rightSidedef: number;

  /** back */
  leftSidedef: number;
}
