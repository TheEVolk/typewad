export default interface IWadHeader {
  type: 'IWAD' | 'PWAD';
  directoryCount: number;
  directoryOffset: number;
}
