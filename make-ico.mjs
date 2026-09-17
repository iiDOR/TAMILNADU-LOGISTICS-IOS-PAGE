import sharp from 'sharp';
import { writeFileSync } from 'fs';

const sizes = [16, 32, 48, 64, 128, 256];

const pngs = await Promise.all(
  sizes.map(s => sharp('tnl.png').resize(s, s).png().toBuffer())
);

// ICO format: ICONDIR + ICONDIRENTRYs + image data
function buildIco(buffers, sizes) {
  const count = buffers.length;
  const headerSize = 6;
  const entrySize = 16;
  const dataOffset = headerSize + entrySize * count;

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);     // reserved
  header.writeUInt16LE(1, 2);     // type: ICO
  header.writeUInt16LE(count, 4); // image count

  let offset = dataOffset;
  const entries = [];
  for (let i = 0; i < count; i++) {
    const entry = Buffer.alloc(16);
    const s = sizes[i];
    entry.writeUInt8(s >= 256 ? 0 : s, 0);  // width (0 = 256)
    entry.writeUInt8(s >= 256 ? 0 : s, 1);  // height
    entry.writeUInt8(0, 2);   // color count
    entry.writeUInt8(0, 3);   // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bit count
    entry.writeUInt32LE(buffers[i].length, 8);  // size
    entry.writeUInt32LE(offset, 12); // offset
    offset += buffers[i].length;
    entries.push(entry);
  }

  return Buffer.concat([header, ...entries, ...buffers]);
}

const ico = buildIco(pngs, sizes);
writeFileSync('public/favicon.ico', ico);
writeFileSync('public/icons/icon.ico', ico);
console.log('✓ public/favicon.ico');
console.log('✓ public/icons/icon.ico');
