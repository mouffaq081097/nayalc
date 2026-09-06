'use client';

/**
 * Downscale + re-encode an image file client-side before upload. Cloudinary's
 * account plan hard-caps uploads at 10MB (independent of any server body-size
 * limit) — phone-camera photos routinely exceed that, so rather than reject
 * them, shrink them until they fit. Only touches files bigger than
 * `skipBelowBytes`; smaller files pass through untouched.
 */
export async function compressImageFile(file, { maxDimension = 2200, quality = 0.85, skipBelowBytes = 2 * 1024 * 1024 } = {}) {
  if (!file.type.startsWith('image/') || file.size <= skipBelowBytes) return file;

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = objectUrl;
    });

    const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);

    let q = quality;
    let blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', q));
    // Step quality down further if it's still too large for Cloudinary's cap.
    while (blob && blob.size > 9.5 * 1024 * 1024 && q > 0.4) {
      q -= 0.15;
      blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', q));
    }

    if (!blob || blob.size >= file.size) return file;
    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], newName, { type: 'image/jpeg' });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
