export default interface IWadMapLinedef {
  startVertex: number;
  endVertex: number;
  flags: number;
  lineType: number;
  sectorTag: number;
  rightSidedef: number;
  leftSidedef: number;
}
