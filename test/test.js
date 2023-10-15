import fs from 'fs';
import { WadReader, WadMap, WadMapLump } from '../lib/index.mjs';

(async () => {
  const buffer = fs.readFileSync('test/dyst2.wad');
  const reader = new WadReader(buffer);
  const map = new WadMap(reader, 'MAP01');

  let i = 0;
  for (const thing of map.get(WadMapLump.Things)) {
    console.log(`[Thing ${i++}] type: ${thing.type}, x: ${thing.x}, y: ${thing.y}, angle: ${thing.angle} flags: ${thing.flags}`);
  }
})();
