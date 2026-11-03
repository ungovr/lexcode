// lexcode-expect: 5
// Recognizing people from their faces in the browser with face-api.js: a 128-number
// descriptor is computed for each face and compared with stored ones.
import * as faceapi from 'face-api.js';

export async function loadModels(url: string): Promise<void> {
  await faceapi.nets.ssdMobilenetv1.loadFromUri(url);
  await faceapi.nets.faceLandmark68Net.loadFromUri(url);
  await faceapi.nets.faceRecognitionNet.loadFromUri(url);
}

export async function enroll(image: HTMLImageElement): Promise<Float32Array | undefined> {
  const result = await faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor();
  return result?.descriptor;
}

export async function whoIsIn(image: HTMLImageElement, known: faceapi.LabeledFaceDescriptors[]): Promise<string[]> {
  const matcher = new faceapi.FaceMatcher(known, 0.55);
  const faces = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors();
  return faces.map((face) => matcher.findBestMatch(face.descriptor).label);
}

export async function descriptorForCrop(canvas: HTMLCanvasElement): Promise<Float32Array> {
  return faceapi.computeFaceDescriptor(canvas) as Promise<Float32Array>;
}
