// lexcode-expect: 0
// Face detection used only to find and crop or blur a face, plain image upload and
// resize, and WebAuthn, which is a device-held key and not a biometric template.
import * as faceapi from 'face-api.js';

export async function loadDetector(url: string): Promise<void> {
  await faceapi.nets.tinyFaceDetector.loadFromUri(url);
}

export async function blurFaces(canvas: HTMLCanvasElement): Promise<number> {
  const boxes = await faceapi.detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions());
  const ctx = canvas.getContext('2d')!;
  for (const { box } of boxes) {
    ctx.filter = 'blur(12px)';
    ctx.drawImage(canvas, box.x, box.y, box.width, box.height, box.x, box.y, box.width, box.height);
  }
  return boxes.length;
}

export async function cropToFirstFace(image: HTMLImageElement): Promise<HTMLCanvasElement | undefined> {
  const detection = await faceapi.detectSingleFace(image);
  if (!detection) return undefined;
  const [crop] = await faceapi.extractFaces(image, [detection]);
  return crop;
}

export async function resizeUpload(file: File, maxEdge: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = new OffscreenCanvas(bitmap.width * scale, bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 });
}

export async function registerPasskey(challenge: Uint8Array, userId: Uint8Array): Promise<Credential | null> {
  return navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'Example' },
      user: { id: userId, name: 'resident', displayName: 'Resident' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      authenticatorSelection: { userVerification: 'preferred' },
    },
  });
}
