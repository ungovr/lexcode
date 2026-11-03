// lexcode-expect: 0
// Rekognition used for things that do not recognize a person: labels, text in an
// image, content moderation, and counting faces in a photo.
import {
  RekognitionClient,
  DetectLabelsCommand,
  DetectTextCommand,
  DetectModerationLabelsCommand,
  DetectFacesCommand,
} from '@aws-sdk/client-rekognition';

const client = new RekognitionClient({ region: 'us-west-2' });

export async function labelsFor(bytes) {
  const reply = await client.send(new DetectLabelsCommand({ Image: { Bytes: bytes }, MaxLabels: 10 }));
  return reply.Labels.map((label) => label.Name);
}

export async function readSign(bytes) {
  const reply = await client.send(new DetectTextCommand({ Image: { Bytes: bytes } }));
  return reply.TextDetections.map((t) => t.DetectedText);
}

export async function isSafe(bytes) {
  const reply = await client.send(new DetectModerationLabelsCommand({ Image: { Bytes: bytes } }));
  return reply.ModerationLabels.length === 0;
}

export async function countFaces(bytes) {
  const reply = await client.send(new DetectFacesCommand({ Image: { Bytes: bytes }, Attributes: ['DEFAULT'] }));
  return reply.FaceDetails.length;
}
