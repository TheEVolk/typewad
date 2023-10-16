import IWadTexturePatch from './wad-texture-patch.interface';

export default interface IWadTexture {
  name: string;
  isMasked: boolean;
  width: number;
  height: number;
  columnDirectory: number;
  patches: IWadTexturePatch[];
}
