/**
 * Client-side image compression before upload. Cuts upload time on slow
 * connections and storage/bandwidth cost, and strips EXIF metadata
 * (canvas re-encode drops it) — location data never leaves the device.
 * No dependencies: canvas + createImageBitmap.
 */

const DEFAULT_MAX_DIMENSION = 1600;
const AVATAR_MAX_DIMENSION = 512;
const DEFAULT_QUALITY = 0.82;

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // keep in sync with storage.rules
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Please choose a JPEG, PNG, WebP, or GIF image.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "Images must be smaller than 5 MB.";
  }
  return null;
}

async function encodeCanvas(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Downscale and re-encode an image. Returns the original file when
 * compression isn't possible (unsupported browser, GIFs — re-encoding
 * would lose animation) or wouldn't help.
 */
export async function compressImage(
  file: File,
  { maxDimension = DEFAULT_MAX_DIMENSION, quality = DEFAULT_QUALITY } = {}
): Promise<File> {
  if (file.type === "image/gif") return file;
  if (typeof createImageBitmap !== "function") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      maxDimension / Math.max(bitmap.width, bitmap.height)
    );

    // Already small and reasonably sized on disk — keep the original.
    if (scale === 1 && file.size < 300 * 1024) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    // Prefer WebP; fall back to JPEG when the browser can't encode it.
    let blob = await encodeCanvas(canvas, "image/webp", quality);
    if (!blob || blob.type !== "image/webp") {
      blob = await encodeCanvas(canvas, "image/jpeg", quality);
    }
    if (!blob || blob.size >= file.size) return file;

    const extension = blob.type === "image/webp" ? "webp" : "jpg";
    return new File([blob], `upload.${extension}`, { type: blob.type });
  } catch {
    return file;
  }
}

/** Avatar preset: small square-ish target, tighter dimension cap. */
export function compressAvatar(file: File): Promise<File> {
  return compressImage(file, { maxDimension: AVATAR_MAX_DIMENSION });
}
