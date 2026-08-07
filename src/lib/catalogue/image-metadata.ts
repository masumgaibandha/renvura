/**
 * Intrinsic image metadata, read from the file's own bytes.
 *
 * Two reasons this exists rather than trusting the filename:
 *
 * 1. **Extensions lie.** `01-fruit-matching-board/image-01.jpg` contains PNG
 *    data. Recording `jpeg` because the name said so would put a wrong
 *    `format` on the product record and mislead the Phase 6 upload pipeline.
 * 2. **Dimensions are required to publish.** `next/image` needs real intrinsic
 *    sizes to reserve space, and CLS < 0.1 is a launch gate (D-14). The
 *    reference products mix 600×600, 552×542, 1024×1024 and 1059×1008 *within a
 *    single product*, so nothing may be assumed.
 *
 * Deliberately dependency-free. `sharp` would do this in one call, but it is
 * Next.js's transitive dependency rather than one this project declares — and
 * the audit record already tracks it as a package we intend to move off.
 * PNG and JPEG are the only formats present.
 */

export type ImageFormat = 'png' | 'jpeg';

export type ImageMetadata = {
  format: ImageFormat;
  width: number;
  height: number;
};

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Start-of-frame markers carrying dimensions. The excluded values inside the
 * 0xC0–0xCF range are not frame headers: 0xC4 (Huffman table), 0xC8 (JPEG
 * extension) and 0xCC (arithmetic coding conditioning).
 */
function isStartOfFrame(marker: number): boolean {
  return marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
}

export function readImageMetadata(buffer: Buffer): ImageMetadata {
  if (buffer.length >= 24 && buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    // IHDR is always the first chunk: width and height are big-endian uint32
    // at byte 16 and 20.
    return {
      format: 'png',
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;

    while (offset < buffer.length - 9) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }

      const marker = buffer[offset + 1]!;

      // Padding bytes, and markers that carry no payload.
      if (marker === 0xff) {
        offset += 1;
        continue;
      }
      if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) {
        offset += 2;
        continue;
      }

      const segmentLength = buffer.readUInt16BE(offset + 2);

      if (isStartOfFrame(marker)) {
        return {
          format: 'jpeg',
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }

      offset += 2 + segmentLength;
    }

    throw new Error('JPEG has no start-of-frame segment; cannot read dimensions');
  }

  throw new Error('Unrecognised image format — expected PNG or JPEG');
}
