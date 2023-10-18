export default interface IWadMapSegment {
  startVertex: number;
  endVertex: number;
  angle: number;
  linedef: number;
  isSameDirection: boolean;
  linedefToSeqOffset: number;
}
