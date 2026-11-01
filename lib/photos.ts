/**
 * Pictures chosen on the form, made ready to be sent (P1-16).
 *
 * A picture from a phone's camera is often 3 to 8 MB, and the server takes 5. Above 1 MB a picture is redrawn at 1600 pixels
 * on its longest side and written as a JPEG, which is far below the limit and still sharp enough to see a leak. If this
 * browser cannot do it (no `createImageBitmap`, an unreadable file), the picture is sent as it is, and the size check of the
 * form tells the person if it is too big. The sizes come from the shared package, whose functions are tested.
 */
import { GUEST_LIMITS, PHOTO_SHRINK_ABOVE_BYTES, fitWithin } from '@/lib/shared';

export const PHOTO_ACCEPT = GUEST_LIMITS.photoTypes.join(',');

/** The names of the formats the form takes, as people write them: file formats are not translated. */
export const PHOTO_FORMAT_NAMES = ['JPEG', 'PNG', 'WebP'];

export async function preparePhoto(file: File): Promise<File> {
  if (file.size <= PHOTO_SHRINK_ABOVE_BYTES) return file;

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const { width, height } = fitWithin(bitmap.width, bitmap.height);

    if (width === 0 || height === 0) return file;

    const canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');

    if (!context) return file;

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));

    // A picture that did not get smaller (a small, already compressed one) is kept as it was.
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], `${file.name.replace(/\.[^.]+$/, '') || 'photo'}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return file;
  }
}

/** The body of one upload call: up to five pictures in the field `photos`. */
export function photosForm(files: readonly File[]): FormData {
  const form = new FormData();

  for (const file of files) form.append('photos', file, file.name);

  return form;
}
