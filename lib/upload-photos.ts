import { failureOf } from "@/lib/guest-errors";
import { photosForm, preparePhoto } from "@/lib/photos";
import { callApi, photoBatches, routes, type Send } from "@/lib/shared";

/**
 * Sends the pictures five at a time, with `sendSlow` (a longer timeout than other calls: pictures are slow on a phone
 * connection). Returns what happened to each: sent, refused by the server for good (with its sentence), or still to send
 * because the call did not get through (a dropped connection may work the next time).
 */
export async function uploadPhotos(
  sendSlow: Send,
  id: number,
  token: string,
  files: File[],
  onProgress: (done: number, total: number) => void,
): Promise<{ sent: number; pending: File[]; refused: string[] }> {
  const ready: File[] = [];

  for (const file of files) ready.push(await preparePhoto(file));

  const batches = photoBatches(ready);
  const pending: File[] = [];
  const refused: string[] = [];
  let sent = 0;

  for (const [index, batch] of batches.entries()) {
    onProgress(index + 1, batches.length);

    try {
      const answer = await callApi(sendSlow, routes.guest.photos(id, token, photosForm(batch)));

      sent += answer.added;
      refused.push(...answer.refused.map((item) => item.reason));
    } catch (error) {
      // A refusal (closed request, too many pictures) will not change by trying again; a network failure may.
      const failure = failureOf(error);

      if (failure.kind === "refused") refused.push(failure.message);
      else pending.push(...batch);
    }
  }

  return { sent, pending, refused };
}
