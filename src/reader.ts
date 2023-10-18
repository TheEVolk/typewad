import createDebugger from 'debug';
import IWadHeader from './types/wad-header.interface';
import IWadLump from './types/wad-lump.interface';

export default class WadReader {
  public header: IWadHeader;
  public lumps: IWadLump[];
  private readonly debug = createDebugger('typewad:reader');

  public constructor(public readonly buffer: Buffer) {
    const startAt = Date.now();

    this.parseHeader();
    this.parseDirectories();

    this.debug(`Parsing time: ${Date.now() - startAt} ms`);
  }

  public getLumpIndex(name: string) {
    for (let i = 0; i < this.lumps.length; i++) {
      if (this.lumps[i].name !== name) {
        continue;
      }

      return i;
    }

    return -1;
  }

  public findLumpIndex(name: string) {
    for (let i = 0; i < this.lumps.length; i++) {
      if (this.lumps[i].name !== name) {
        continue;
      }

      return i;
    }

    throw new Error('Invalid lump name');
  }

  public getLump(name: string) {
    for (let i = 0; i < this.lumps.length; i++) {
      if (this.lumps[i].name !== name) {
        continue;
      }

      return this.lumps[i];
    }
  }

  public findLump(name: string) {
    const index = this.findLumpIndex(name);
    return this.lumps[index];
  }

  private parseHeader() {
    this.debug('Parsing Header:');
    const type = this.buffer.toString('utf-8', 0, 4) as ('PWAD' | 'IWAD');
    const directoryCount = this.buffer.readInt32LE(4);
    const directoryOffset = this.buffer.readInt32LE(8);

    this.debug(`[Header] type: ${type}, directoryCount: ${directoryCount}, directoryOffset: ${directoryOffset}`);
    this.header = { type, directoryCount, directoryOffset };
  }

  private parseDirectories() {
    this.lumps = new Array(this.header.directoryCount);

    // allow use on browsers polyfills
    const lumpNameBuffer = this.buffer.constructor.alloc(8);
  
    for (let i = 0; i < this.header.directoryCount; i++) {
      const directoryOffset = this.header.directoryOffset + i * 16;
      const lumpOffset = this.buffer.readInt32LE(directoryOffset);
      const lumpSize = this.buffer.readInt32LE(directoryOffset + 4);
  
      this.buffer.copy(lumpNameBuffer, 0, directoryOffset + 8, directoryOffset + 16);
      const nullTerminatorIndex = lumpNameBuffer.indexOf(0);
      const lumpNameEnd = nullTerminatorIndex > 0 ? nullTerminatorIndex : lumpNameBuffer.byteLength;
      const lumpName = lumpNameBuffer.toString('utf-8', 0, lumpNameEnd);
  
      this.lumps[i] = {
        name: lumpName,
        offset: lumpOffset,
        size: lumpSize,
        // buffer: this.buffer.subarray(lumpOffset, lumpOffset + lumpSize),
      };
  
      this.debug(`[Dir ${i}] ${lumpName} (offset: ${lumpOffset}, size: ${lumpSize})`);
    }
  }
}
