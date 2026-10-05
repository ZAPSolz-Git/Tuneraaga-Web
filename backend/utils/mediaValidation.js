 

const REQUIRED_COVER = {
  minWidth: 3000,
  minHeight: 3000,
};

const MAX_RELEASE_ALBUMS = 10;
const MAX_ALBUM_TRACKS = 10;

// ─── JPEG ────────────────────────────────────────────────────
// Returns { width, height } or null if the buffer is not a readable JPEG.
const readJpegSize = (buf) => {
  if (!buf || buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;

  let offset = 2;
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buf[offset + 1];
    // Fill bytes / standalone markers without a length field
    if (marker === 0xff) {
      offset += 1;
      continue;
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const segLen = buf.readUInt16BE(offset + 2);
    // SOFn markers carry the frame size (C4, C8 and CC are not SOF)
    const isSof =
      marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isSof) {
      return {
        height: buf.readUInt16BE(offset + 5),
        width: buf.readUInt16BE(offset + 7),
      };
    }
    if (segLen < 2) return null;
    offset += 2 + segLen;
  }
  return null;
};

// Returns an error message, or null when the cover is acceptable.
const validateCover = (buf) => {
  const size = readJpegSize(buf);
  if (!size) {
    return "Invalid poster format. The poster must be a JPG (JPEG) image.";
  }
  if (size.width < REQUIRED_COVER.minWidth || size.height < REQUIRED_COVER.minHeight) {
    return `Poster resolution too low. Required: at least ${REQUIRED_COVER.minWidth} × ${REQUIRED_COVER.minHeight} px. Your image: ${size.width} × ${size.height} px.`;
  }
  return null;
};

// ─── WAV ─────────────────────────────────────────────────────
// Only the container format is checked: a RIFF/WAVE header.
const validateAudio = (buf) => {
  const isWav =
    buf &&
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WAVE";
  return isWav
    ? null
    : "Invalid audio format. The audio file must be in WAV format.";
};

module.exports = {
  REQUIRED_COVER,
  MAX_RELEASE_ALBUMS,
  MAX_ALBUM_TRACKS,
  readJpegSize,
  validateCover,
  validateAudio,
};
