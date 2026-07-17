/*
 * qr.js — Self-contained, dependency-free QR Code encoder (ES module).
 *
 * Faithful, compact JavaScript port of the algorithm from Project Nayuki's
 * "QR Code generator library" (https://www.nayuki.io/page/qr-code-generator-library).
 * Original work Copyright (c) Project Nayuki, released under the MIT License.
 * This port keeps the exact encoding logic (BYTE mode / UTF-8, Reed–Solomon ECC,
 * automatic smallest-version selection, all 8 data masks with penalty scoring,
 * and BCH format + version information) so the output is a REAL, scannable QR code.
 *
 * No imports, no network, no Node-only APIs. Pure browser-safe ES module.
 *
 * Public API:
 *   qrSvg(text, opts)  -> SVG string
 *   qrMatrix(text, ecl) -> { size:Number, modules:boolean[][] }  (true = dark)
 *
 * MIT License. Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software, to deal in the Software without restriction.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

'use strict';

/* ---------------------------------------------------------------------------
 * Error-correction levels
 * ------------------------------------------------------------------------- */

// ordinal: index into the ECC lookup tables. formatBits: value packed into the
// 15-bit format information (per the QR spec, this is NOT the same as ordinal).
const Ecc = {
  LOW:      { ordinal: 0, formatBits: 1 },
  MEDIUM:   { ordinal: 1, formatBits: 0 },
  QUARTILE: { ordinal: 2, formatBits: 3 },
  HIGH:     { ordinal: 3, formatBits: 2 },
};

const ECL_MAP = {
  L: Ecc.LOW, M: Ecc.MEDIUM, Q: Ecc.QUARTILE, H: Ecc.HIGH,
};

/* ---------------------------------------------------------------------------
 * Segment encoding mode (this port encodes everything as BYTE / UTF-8)
 * ------------------------------------------------------------------------- */

const Mode = {
  BYTE: {
    modeBits: 0x4,
    numCharCountBits(ver) { return ver < 10 ? 8 : 16; },
  },
};

/* ---------------------------------------------------------------------------
 * Per-version ECC lookup tables (index 0 is an unused padding slot = -1)
 * Rows are ordered: Low, Medium, Quartile, High
 * ------------------------------------------------------------------------- */

// Number of ECC codewords per block, per [ecl.ordinal][version].
const ECC_CODEWORDS_PER_BLOCK = [
  // 0  1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18  19  20  21  22  23  24  25  26  27  28  29  30  31  32  33  34  35  36  37  38  39  40
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30], // Low
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], // Medium
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30], // Quartile
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30], // High
];

// Number of ECC blocks, per [ecl.ordinal][version].
const NUM_ERROR_CORRECTION_BLOCKS = [
  // 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25], // Low
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49], // Medium
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68], // Quartile
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81], // High
];

const MIN_VERSION = 1;
const MAX_VERSION = 40;
const PENALTY_N1 = 3;
const PENALTY_N2 = 3;
const PENALTY_N3 = 40;
const PENALTY_N4 = 10;

/* ---------------------------------------------------------------------------
 * Low-level bit helpers
 * ------------------------------------------------------------------------- */

function getBit(x, i) {
  return ((x >>> i) & 1) !== 0;
}

// Appends the given number of low-order bits of `val` to the bit buffer `bb`.
function appendBits(val, len, bb) {
  if (len < 0 || len > 31 || (val >>> len) !== 0) {
    throw new RangeError('Value out of range for appendBits');
  }
  for (let i = len - 1; i >= 0; i--) {
    bb.push((val >>> i) & 1);
  }
}

// Encodes a JS string to an array of UTF-8 byte values (0..255).
function toUtf8ByteArray(str) {
  const out = [];
  for (const ch of str) { // iterate by Unicode code point (handles surrogate pairs)
    const cp = ch.codePointAt(0);
    if (cp < 0x80) {
      out.push(cp);
    } else if (cp < 0x800) {
      out.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f));
    } else if (cp < 0x10000) {
      out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
    } else {
      out.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f),
      );
    }
  }
  return out;
}

/* ---------------------------------------------------------------------------
 * Reed–Solomon error correction over GF(2^8) with the QR primitive 0x11D
 * ------------------------------------------------------------------------- */

// Returns the product of two field elements modulo GF(2^8/0x11D).
function reedSolomonMultiply(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}

// Returns the coefficients of the Reed–Solomon generator polynomial of the
// given degree (a divisor for the remainder computation).
function reedSolomonComputeDivisor(degree) {
  if (degree < 1 || degree > 255) {
    throw new RangeError('Degree out of range');
  }
  const result = [];
  for (let i = 0; i < degree - 1; i++) result.push(0);
  result.push(1); // start as the monomial x^0
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = reedSolomonMultiply(result[j], root);
      if (j + 1 < result.length) result[j] ^= result[j + 1];
    }
    root = reedSolomonMultiply(root, 0x02);
  }
  return result;
}

// Returns the RS remainder of `data` divided by `divisor` (i.e. the ECC bytes).
function reedSolomonComputeRemainder(data, divisor) {
  const result = divisor.map(() => 0);
  for (const b of data) {
    const factor = b ^ result.shift();
    result.push(0);
    divisor.forEach((coef, i) => {
      result[i] ^= reedSolomonMultiply(coef, factor);
    });
  }
  return result;
}

/* ---------------------------------------------------------------------------
 * Version / capacity math
 * ------------------------------------------------------------------------- */

// Number of data + ECC module bits available at a version (excluding function
// patterns and format/version info), as a raw count in bits.
function getNumRawDataModules(ver) {
  if (ver < MIN_VERSION || ver > MAX_VERSION) {
    throw new RangeError('Version out of range');
  }
  let result = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const numAlign = Math.floor(ver / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (ver >= 7) result -= 36;
  }
  return result;
}

// Number of 8-bit data codewords (not ECC) available at a version + ECL.
function getNumDataCodewords(ver, ecl) {
  return (
    Math.floor(getNumRawDataModules(ver) / 8) -
    ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver] *
      NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver]
  );
}

/* ---------------------------------------------------------------------------
 * Segment helpers
 * ------------------------------------------------------------------------- */

// Builds one BYTE-mode segment from an array of byte values.
function makeBytes(data) {
  const bb = [];
  for (const b of data) appendBits(b, 8, bb);
  return { mode: Mode.BYTE, numChars: data.length, bitData: bb };
}

// Total number of bits needed to encode the segments at the given version, or
// Infinity if a segment's character count does not fit its count field.
function getTotalBits(segs, version) {
  let result = 0;
  for (const seg of segs) {
    const ccbits = seg.mode.numCharCountBits(version);
    if (seg.numChars >= (1 << ccbits)) return Infinity;
    result += 4 + ccbits + seg.bitData.length;
  }
  return result;
}

/* ---------------------------------------------------------------------------
 * QrCode — builds the module matrix for a set of data codewords
 * ------------------------------------------------------------------------- */

class QrCode {
  constructor(version, ecl, dataCodewords, msk) {
    if (version < MIN_VERSION || version > MAX_VERSION) {
      throw new RangeError('Version out of range');
    }
    if (msk < -1 || msk > 7) {
      throw new RangeError('Mask out of range');
    }
    this.version = version;
    this.errorCorrectionLevel = ecl;
    this.size = version * 4 + 17;

    const blankRow = new Array(this.size).fill(false);
    this.modules = [];
    this.isFunction = [];
    for (let i = 0; i < this.size; i++) {
      this.modules.push(blankRow.slice());
      this.isFunction.push(blankRow.slice());
    }

    this.drawFunctionPatterns();
    const allCodewords = this.addEccAndInterleave(dataCodewords);
    this.drawCodewords(allCodewords);

    // Pick the mask with the lowest penalty if not fixed.
    if (msk === -1) {
      let minPenalty = Infinity;
      for (let i = 0; i < 8; i++) {
        this.applyMask(i);
        this.drawFormatBits(i);
        const penalty = this.getPenaltyScore();
        if (penalty < minPenalty) {
          msk = i;
          minPenalty = penalty;
        }
        this.applyMask(i); // undoes the mask (XOR is its own inverse)
      }
    }
    this.mask = msk;
    this.applyMask(msk);
    this.drawFormatBits(msk);
  }

  static encodeText(text, ecl) {
    const seg = makeBytes(toUtf8ByteArray(text));
    return QrCode.encodeSegments([seg], ecl);
  }

  static encodeSegments(segs, ecl, boostEcl = true) {
    // Find the smallest version that fits.
    let version;
    let dataUsedBits;
    for (version = MIN_VERSION; ; version++) {
      const dataCapacityBits = getNumDataCodewords(version, ecl) * 8;
      const usedBits = getTotalBits(segs, version);
      if (usedBits <= dataCapacityBits) {
        dataUsedBits = usedBits;
        break;
      }
      if (version >= MAX_VERSION) {
        throw new RangeError('Data too long to fit in any QR Code version');
      }
    }

    // Boost the ECC level for free if the data still fits.
    for (const newEcl of [Ecc.MEDIUM, Ecc.QUARTILE, Ecc.HIGH]) {
      if (boostEcl && dataUsedBits <= getNumDataCodewords(version, newEcl) * 8) {
        ecl = newEcl;
      }
    }

    // Concatenate all segments into one bit buffer.
    const bb = [];
    for (const seg of segs) {
      appendBits(seg.mode.modeBits, 4, bb);
      appendBits(seg.numChars, seg.mode.numCharCountBits(version), bb);
      for (const bit of seg.bitData) bb.push(bit);
    }

    // Terminator + byte alignment + alternating pad bytes.
    const dataCapacityBits = getNumDataCodewords(version, ecl) * 8;
    appendBits(0, Math.min(4, dataCapacityBits - bb.length), bb);
    appendBits(0, (8 - (bb.length % 8)) % 8, bb);
    for (let padByte = 0xec; bb.length < dataCapacityBits; padByte ^= 0xec ^ 0x11) {
      appendBits(padByte, 8, bb);
    }

    // Pack bits into big-endian bytes.
    const dataCodewords = new Array(bb.length >>> 3).fill(0);
    bb.forEach((bit, i) => {
      dataCodewords[i >>> 3] |= bit << (7 - (i & 7));
    });

    return new QrCode(version, ecl, dataCodewords, -1);
  }

  // -- function-pattern drawing -------------------------------------------

  drawFunctionPatterns() {
    // Timing patterns.
    for (let i = 0; i < this.size; i++) {
      this.setFunctionModule(6, i, i % 2 === 0);
      this.setFunctionModule(i, 6, i % 2 === 0);
    }
    // Finder patterns at three corners.
    this.drawFinderPattern(3, 3);
    this.drawFinderPattern(this.size - 4, 3);
    this.drawFinderPattern(3, this.size - 4);
    // Alignment patterns.
    const alignPos = this.getAlignmentPatternPositions();
    const numAlign = alignPos.length;
    for (let i = 0; i < numAlign; i++) {
      for (let j = 0; j < numAlign; j++) {
        if (
          !(
            (i === 0 && j === 0) ||
            (i === 0 && j === numAlign - 1) ||
            (i === numAlign - 1 && j === 0)
          )
        ) {
          this.drawAlignmentPattern(alignPos[i], alignPos[j]);
        }
      }
    }
    // Placeholder format + version info (overwritten later).
    this.drawFormatBits(0);
    this.drawVersion();
  }

  drawFormatBits(mask) {
    const data = (this.errorCorrectionLevel.formatBits << 3) | mask; // 5 bits
    let rem = data;
    for (let i = 0; i < 10; i++) {
      rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    }
    const bits = ((data << 10) | rem) ^ 0x5412; // 15 bits, BCH + mask

    // First copy around the top-left finder.
    for (let i = 0; i <= 5; i++) this.setFunctionModule(8, i, getBit(bits, i));
    this.setFunctionModule(8, 7, getBit(bits, 6));
    this.setFunctionModule(8, 8, getBit(bits, 7));
    this.setFunctionModule(7, 8, getBit(bits, 8));
    for (let i = 9; i < 15; i++) this.setFunctionModule(14 - i, 8, getBit(bits, i));

    // Second copy near the other two finders.
    for (let i = 0; i < 8; i++) {
      this.setFunctionModule(this.size - 1 - i, 8, getBit(bits, i));
    }
    for (let i = 8; i < 15; i++) {
      this.setFunctionModule(8, this.size - 15 + i, getBit(bits, i));
    }
    this.setFunctionModule(8, this.size - 8, true); // always dark
  }

  drawVersion() {
    if (this.version < 7) return;
    let rem = this.version;
    for (let i = 0; i < 12; i++) {
      rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    }
    const bits = (this.version << 12) | rem; // 18 bits
    for (let i = 0; i < 18; i++) {
      const color = getBit(bits, i);
      const a = this.size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      this.setFunctionModule(a, b, color);
      this.setFunctionModule(b, a, color);
    }
  }

  drawFinderPattern(x, y) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy)); // Chebyshev norm
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) {
          this.setFunctionModule(xx, yy, dist !== 2 && dist !== 4);
        }
      }
    }
  }

  drawAlignmentPattern(x, y) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        this.setFunctionModule(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  }

  setFunctionModule(x, y, isDark) {
    this.modules[y][x] = isDark;
    this.isFunction[y][x] = true;
  }

  getAlignmentPatternPositions() {
    if (this.version === 1) return [];
    const numAlign = Math.floor(this.version / 7) + 2;
    const step =
      this.version === 32
        ? 26
        : Math.ceil((this.version * 4 + 4) / (numAlign * 2 - 2)) * 2;
    const result = [6];
    for (let pos = this.size - 7; result.length < numAlign; pos -= step) {
      result.splice(1, 0, pos);
    }
    return result;
  }

  // -- data + ECC ----------------------------------------------------------

  addEccAndInterleave(data) {
    const ver = this.version;
    const ecl = this.errorCorrectionLevel;
    const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver];
    const blockEccLen = ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver];
    const rawCodewords = Math.floor(getNumRawDataModules(ver) / 8);
    const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
    const shortBlockLen = Math.floor(rawCodewords / numBlocks);

    if (data.length !== getNumDataCodewords(ver, ecl)) {
      throw new RangeError('Invalid data codeword count');
    }

    // Split into blocks and append ECC to each block.
    const blocks = [];
    const rsDiv = reedSolomonComputeDivisor(blockEccLen);
    for (let i = 0, k = 0; i < numBlocks; i++) {
      const dat = data.slice(
        k,
        k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1),
      );
      k += dat.length;
      const ecc = reedSolomonComputeRemainder(dat, rsDiv);
      if (i < numShortBlocks) dat.push(0);
      blocks.push(dat.concat(ecc));
    }

    // Interleave the codewords from every block.
    const result = [];
    for (let i = 0; i < blocks[0].length; i++) {
      blocks.forEach((block, j) => {
        // Skip the padding cell that only short blocks have.
        if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) {
          result.push(block[i]);
        }
      });
    }
    return result;
  }

  drawCodewords(data) {
    let i = 0; // bit index into data
    for (let right = this.size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < this.size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? this.size - 1 - vert : vert;
          if (!this.isFunction[y][x] && i < data.length * 8) {
            this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7));
            i++;
          }
        }
      }
    }
  }

  // -- masking + penalty ---------------------------------------------------

  applyMask(mask) {
    if (mask < 0 || mask > 7) throw new RangeError('Mask out of range');
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        let invert;
        switch (mask) {
          case 0: invert = (x + y) % 2 === 0; break;
          case 1: invert = y % 2 === 0; break;
          case 2: invert = x % 3 === 0; break;
          case 3: invert = (x + y) % 3 === 0; break;
          case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: invert = ((x * y) % 2) + ((x * y) % 3) === 0; break;
          case 6: invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          case 7: invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          default: throw new Error('Unreachable');
        }
        if (!this.isFunction[y][x] && invert) {
          this.modules[y][x] = !this.modules[y][x];
        }
      }
    }
  }

  getPenaltyScore() {
    let result = 0;

    // Rule 1 + 3 across rows.
    for (let y = 0; y < this.size; y++) {
      let runColor = false;
      let runX = 0;
      const runHistory = [0, 0, 0, 0, 0, 0, 0];
      for (let x = 0; x < this.size; x++) {
        if (this.modules[y][x] === runColor) {
          runX++;
          if (runX === 5) result += PENALTY_N1;
          else if (runX > 5) result++;
        } else {
          this.finderPenaltyAddHistory(runX, runHistory);
          if (!runColor) {
            result += this.finderPenaltyCountPatterns(runHistory) * PENALTY_N3;
          }
          runColor = this.modules[y][x];
          runX = 1;
        }
      }
      result += this.finderPenaltyTerminateAndCount(runColor, runX, runHistory) * PENALTY_N3;
    }

    // Rule 1 + 3 across columns.
    for (let x = 0; x < this.size; x++) {
      let runColor = false;
      let runY = 0;
      const runHistory = [0, 0, 0, 0, 0, 0, 0];
      for (let y = 0; y < this.size; y++) {
        if (this.modules[y][x] === runColor) {
          runY++;
          if (runY === 5) result += PENALTY_N1;
          else if (runY > 5) result++;
        } else {
          this.finderPenaltyAddHistory(runY, runHistory);
          if (!runColor) {
            result += this.finderPenaltyCountPatterns(runHistory) * PENALTY_N3;
          }
          runColor = this.modules[y][x];
          runY = 1;
        }
      }
      result += this.finderPenaltyTerminateAndCount(runColor, runY, runHistory) * PENALTY_N3;
    }

    // Rule 2: 2x2 blocks of the same color.
    for (let y = 0; y < this.size - 1; y++) {
      for (let x = 0; x < this.size - 1; x++) {
        const color = this.modules[y][x];
        if (
          color === this.modules[y][x + 1] &&
          color === this.modules[y + 1][x] &&
          color === this.modules[y + 1][x + 1]
        ) {
          result += PENALTY_N2;
        }
      }
    }

    // Rule 4: overall dark/light balance.
    let dark = 0;
    for (const row of this.modules) {
      dark = row.reduce((sum, color) => sum + (color ? 1 : 0), dark);
    }
    const total = this.size * this.size;
    const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
    result += k * PENALTY_N4;

    return result;
  }

  finderPenaltyCountPatterns(runHistory) {
    const n = runHistory[1];
    const core =
      n > 0 &&
      runHistory[2] === n &&
      runHistory[3] === n * 3 &&
      runHistory[4] === n &&
      runHistory[5] === n;
    return (
      (core && runHistory[0] >= n * 4 && runHistory[6] >= n ? 1 : 0) +
      (core && runHistory[6] >= n * 4 && runHistory[0] >= n ? 1 : 0)
    );
  }

  finderPenaltyTerminateAndCount(currentRunColor, currentRunLength, runHistory) {
    if (currentRunColor) {
      this.finderPenaltyAddHistory(currentRunLength, runHistory);
      currentRunLength = 0;
    }
    currentRunLength += this.size; // trailing light border
    this.finderPenaltyAddHistory(currentRunLength, runHistory);
    return this.finderPenaltyCountPatterns(runHistory);
  }

  finderPenaltyAddHistory(currentRunLength, runHistory) {
    if (runHistory[0] === 0) currentRunLength += this.size; // leading light border
    runHistory.pop();
    runHistory.unshift(currentRunLength);
  }
}

/* ---------------------------------------------------------------------------
 * Public API
 * ------------------------------------------------------------------------- */

/**
 * Encodes `text` (UTF-8, byte mode) as a QR Code and returns the module matrix.
 * @param {string} text
 * @param {string} [ecl='M'] one of 'L' | 'M' | 'Q' | 'H'
 * @returns {{ size:number, modules:boolean[][] }} true = dark module
 */
export function qrMatrix(text, ecl = 'M') {
  const level = ECL_MAP[String(ecl).toUpperCase()] || Ecc.MEDIUM;
  const qr = QrCode.encodeText(String(text), level);
  return { size: qr.size, modules: qr.modules };
}

/**
 * Encodes `text` as a QR Code and returns a self-contained SVG string.
 * @param {string} text
 * @param {Object} [opts]
 * @param {number} [opts.size=200] total width/height in px
 * @param {number} [opts.margin=4] quiet-zone width in modules
 * @param {string} [opts.dark='#0f1e3d'] dark module color
 * @param {string} [opts.light='#ffffff'] background color
 * @param {string} [opts.ecl='M'] error-correction level: 'L' | 'M' | 'Q' | 'H'
 * @returns {string} SVG markup
 */
export function qrSvg(text, opts = {}) {
  const {
    size = 200,
    margin = 4,
    dark = '#0f1e3d',
    light = '#ffffff',
    ecl = 'M',
  } = opts;

  const { size: n, modules } = qrMatrix(text, ecl);
  const dim = n + margin * 2;

  // One path segment per dark module — crisp and scalable.
  let path = '';
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (modules[y][x]) {
        path += `M${x + margin},${y + margin}h1v1h-1z`;
      }
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" ` +
    `viewBox="0 0 ${dim} ${dim}" shape-rendering="crispEdges" role="img" aria-label="QR code">` +
    `<rect width="${dim}" height="${dim}" fill="${light}"/>` +
    `<path d="${path}" fill="${dark}"/>` +
    `</svg>`
  );
}

/**
 * Internal building blocks exposed for self-consistency testing only.
 * Not part of the stable public API.
 */
export const __qrInternals = {
  reedSolomonMultiply,
  reedSolomonComputeDivisor,
  reedSolomonComputeRemainder,
  getNumDataCodewords,
  getNumRawDataModules,
  ECC_CODEWORDS_PER_BLOCK,
  NUM_ERROR_CORRECTION_BLOCKS,
  Ecc,
};
