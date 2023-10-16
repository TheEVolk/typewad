import WadReader from './reader.js';
import IWadLump from './types/wad-lump.interface.js';
import IWadPicture from './types/wad-picture.interface.js';
import IWadTexturePatch from './types/wad-texture-patch.interface.js';
import IWadTexture from './types/wad-texture.interface.js';
import { readString } from './util.js';

export default class WadTextures {
  public readonly textures = [];
  public readonly textureByName = new Map<string, IWadTexture>();
  public readonly pictures = new Map<string, IWadPicture>();
  private pnamesLump: IWadLump;
  private palleteOffset: number;

  public constructor(private readonly wad: WadReader) {
    this.palleteOffset = wad.getLump('PLAYPAL').offset;
    console.log('pallete', this.palleteOffset);
    for (let i = 0; i < 256; i++) {
      console.log(`%c color: ${i}`, `color: rgb(${this.getColor(i).join(', ')})`);
    }

    this.loadPatchs();

    const texture1Index = wad.findLumpIndex('TEXTURE1');
    const texture1Lump = wad.lumps[texture1Index];
    this.loadTextures(texture1Lump);

    const texture2Lump = wad.lumps[texture1Index + 1];
    if (texture2Lump.name === 'TEXTURE2') {
      this.loadTextures(texture2Lump);
    }
  }

  public getColor(id: number) {
    const index = id * 3;
    return [
      this.wad.buffer.readUInt8(this.palleteOffset + index),
      this.wad.buffer.readUInt8(this.palleteOffset + index + 1),
      this.wad.buffer.readUInt8(this.palleteOffset + index + 2),
    ];
  }
 
  public pictureToImageData(picture: IWadPicture) {
      const imageDataLength = picture.width * picture.height * 4;
      const imageData = new Uint8ClampedArray(imageDataLength);

      for (let i = 0; i < picture.width; i++) {
        this.drawColumn(imageData, picture, i);
	    }	
  
      return imageData;
  }

  private drawColumn(data: Uint8ClampedArray, picture: IWadPicture, column: number) {
    const columnOffset = picture.columnOffsets[column];

    let postOffset = picture.lumpOffset + columnOffset;
    while (true) {
      const length = this.drawColumnPost(data, picture, column, postOffset);
      if (length === false) {
        break;
      }

      postOffset += 4 + length;
    }
  }

  private drawColumnPost(data: Uint8ClampedArray, picture: IWadPicture, column: number, offset: number) {
    const topDelta = this.wad.buffer.readUInt8(offset);
    if (topDelta === 0xff) {
      return false;
    }

    const length = this.wad.buffer.readUInt8(offset + 1);
    for (let i = 0; i < length; i++) {
      const x = column;
      const y = topDelta + i;
      const index = (y * picture.width + x) * 4;

      const colorId = this.wad.buffer.readUInt8(offset + 3 + i);
      const [r, g, b] = this.getColor(colorId);

      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = 255;
    }

    return length;
  }

  private loadPatchs() {
    this.pnamesLump = this.wad.findLump('PNAMES');
    const pnameCount = this.wad.buffer.readUint32LE(this.pnamesLump.offset);
    for (let i = 0; i < pnameCount; i++) {
      const name = readString(this.wad.buffer, this.pnamesLump.offset + 4 + i * 8);
      this.loadPicture(name);
    }
  }

  private loadPicture(name: string) {
    const lump = this.wad.getLump(name);
    if (!lump) {
      // why w94_1 not exists?
      console.warn(`Warn lump picture ${name} not found`);
      return;
    }

    const width = this.wad.buffer.readUInt16LE(lump.offset);
    const columnOffsets = Array.from({ length: width }, (_, i) => this.wad.buffer.readUInt32LE(lump.offset + 8 + i * 4));

    const picture: IWadPicture = {
      width,
      height: this.wad.buffer.readUInt16LE(lump.offset + 2),
      offsetX: this.wad.buffer.readInt16LE(lump.offset + 4),
      offsetY: this.wad.buffer.readInt16LE(lump.offset + 6),
      lumpOffset: lump.offset,
      columnOffsets,
    };

    this.pictures.set(name, picture);
  }

  private loadTextures(lump: IWadLump) {
    const count = this.wad.buffer.readInt16LE(lump.offset);

    let mapsOffset = lump.offset + 4 + count * 4;
    const textures = Array.from({ length: count });

    for (let i = 0; i < count; i++) {
      const texture = this.loadTextureStructure(mapsOffset);
      mapsOffset += 22 + 10 * texture.patches.length;
      textures[i] = texture;
      this.textureByName.set(texture.name, texture);
    }

    this.textures.push(...textures);
  }

  private loadTextureStructure(offset: number): IWadTexture {
    const pathCount = this.wad.buffer.readInt16LE(offset + 20);
    const patches = Array.from({ length: pathCount }, (_, i) => this.loadPathStructure(offset + 22 + i * 10));

    return {
      name: readString(this.wad.buffer, offset),
      isMasked: this.wad.buffer.readInt32LE(offset + 8) === 1,
      width: this.wad.buffer.readInt16LE(offset + 12),
      height: this.wad.buffer.readInt16LE(offset + 14),
      columnDirectory: this.wad.buffer.readInt32LE(offset + 16),
      patches,
    };
  }

  private loadPathStructure(offset: number): IWadTexturePatch {
    const patchId = this.wad.buffer.readInt16LE(offset + 4);
    return {
      originX: this.wad.buffer.readInt16LE(offset),
      originY: this.wad.buffer.readInt16LE(offset + 2),
      patch: readString(this.wad.buffer, this.pnamesLump.offset + 4 + patchId * 8),
      stepdir: this.wad.buffer.readInt16LE(offset + 6),
      colormap: this.wad.buffer.readInt16LE(offset + 8),
    };
  }
}
