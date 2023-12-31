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
  public readonly flats = new Map<string, number>();
  private pnamesLump: IWadLump;
  private palleteOffset: number;

  public constructor(private readonly wad: WadReader) {
    this.palleteOffset = wad.getLump('PLAYPAL').offset;
    this.loadPatchs();
    this.loadFlats();

    const texture1Index = wad.findLumpIndex('TEXTURE1');
    const texture1Lump = wad.lumps[texture1Index];
    this.loadTextures(texture1Lump);

    const texture2Lump = wad.lumps[texture1Index + 1];
    if (texture2Lump?.name === 'TEXTURE2') {
      this.loadTextures(texture2Lump);
    }
  }

  public static hasTextures(wad: WadReader) {
    return Boolean(wad.getLump('TEXTURE1'));
  }

  public getColor(id: number) {
    const index = id * 3;
    return [
      this.wad.buffer.readUInt8(this.palleteOffset + index),
      this.wad.buffer.readUInt8(this.palleteOffset + index + 1),
      this.wad.buffer.readUInt8(this.palleteOffset + index + 2),
    ];
  }

  public textureToImageData(texture: IWadTexture) {
    const textureImageData = new Uint8ClampedArray(texture.width * texture.height * 4);
    for (const patch of texture.patches) {
      const picture = this.pictures.get(patch.patch);
      if (!picture) {
        continue;
      }

      const imageData = this.pictureToImageData(picture);
      this.applyPictureInPicture(
        textureImageData,
        imageData,
        0,
        0,
        picture.width,
        picture.height,
        patch.originX,
        patch.originY,
        texture.width,
        texture.height,
      );
    }

    return textureImageData;
  }

  public pictureToImageData(picture: IWadPicture) {
    const imageDataLength = picture.width * picture.height * 4;
    const imageData = new Uint8ClampedArray(imageDataLength);

    for (let i = 0; i < picture.width; i++) {
      this.drawColumn(imageData, picture, i);
    }

    return imageData;
  }

  public flatToImageData(offset: number) {
    const data = new Uint8ClampedArray(64 * 64 * 4);
    for (let i = 0; i < 64 * 64; i++) {
      const colorId = this.wad.buffer.readUInt8(offset + i);
      const [r, g, b] = this.getColor(colorId);

      const index = i * 4;
      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = 255;
    }

    return data;
  }


  private loadFlats() {
    const startMarkerIndex = this.wad.getLumpIndex('F_START');
    if (startMarkerIndex === -1) {
      return;
    }

    for (let i = startMarkerIndex + 1; ; i++) {
      const lump = this.wad.lumps[i];
      if (!lump || lump.name === 'F_END') {
        break;
      }

      if (lump.size === 0) {
        continue;
      }

      this.flats.set(lump.name, lump.offset);
    }
  }

  private applyPictureInPicture(
    dest: Uint8ClampedArray,
    src: Uint8ClampedArray,
    srcX: number,
    srcY: number,
    srcWidth: number,
    srcHeight: number,
    destX: number,
    destY: number,
    destWidth: number,
    destHeight: number,
  ) {
    const destPixelSize = 4; // Each pixel in the destination has 4 values (RGBA)
    const srcPixelSize = 4;  // Each pixel in the source has 4 values (RGBA)

    for (let y = 0; y < srcHeight; y++) {
      for (let x = 0; x < srcWidth; x++) {
        const srcIndex = ((srcY + y) * srcWidth + (srcX + x)) * srcPixelSize;
        const destIndex = ((destY + y) * destWidth + (destX + x)) * destPixelSize;

        // Copy RGBA values from source to destination
        dest[destIndex] = src[srcIndex];         // Red
        dest[destIndex + 1] = src[srcIndex + 1]; // Green
        dest[destIndex + 2] = src[srcIndex + 2]; // Blue
        dest[destIndex + 3] = src[srcIndex + 3]; // Alpha
      }
    }
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
    try {
      const [lump] = this.wad.find((lump, i, marker) => name === lump.name && marker !== 'F');
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

    } catch (error) {
      console.log(error);
      throw new Error(`Picture ${name}: ${error.message}`);
    }
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
