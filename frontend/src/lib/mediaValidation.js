// Client-side pre-checks for release uploads. These give instant feedback;
// the backend (backend/utils/mediaValidation.js) enforces the same rules.

export const COVER_MIN_SIZE = 3000;

const readBytes = async (file, length) =>
  new Uint8Array(await file.slice(0, length).arrayBuffer());

// Returns an error message, or null when the poster is acceptable.
export async function validateCoverFile(file) {
  const head = await readBytes(file, 3);
  const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  if (!isJpeg) {
    return "Invalid poster format. The poster must be a JPG (JPEG) image.";
  }
  const dims = await new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
  if (!dims) return "Cannot read image file. Please upload a valid JPG image.";
  if (dims.w < COVER_MIN_SIZE || dims.h < COVER_MIN_SIZE) {
    return `Poster resolution too low. Required: at least ${COVER_MIN_SIZE} × ${COVER_MIN_SIZE} px. Your image: ${dims.w} × ${dims.h} px.`;
  }
  return null;
}

// Returns an error message, or null when the audio is acceptable (WAV only).
export async function validateAudioFile(file) {
  const head = await readBytes(file, 12);
  const tag = (o) => String.fromCharCode(...head.slice(o, o + 4));
  if (head.length < 12 || tag(0) !== "RIFF" || tag(8) !== "WAVE") {
    return "Invalid audio format. The audio file must be in WAV format.";
  }
  return null;
}
