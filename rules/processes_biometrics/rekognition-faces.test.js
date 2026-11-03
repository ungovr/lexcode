// lexcode-expect: 4
// Matching faces with Amazon Rekognition: index a face, search a collection, and
// compare two photos.
import {
  RekognitionClient,
  IndexFacesCommand,
  SearchFacesByImageCommand,
  CompareFacesCommand,
} from '@aws-sdk/client-rekognition';
import AWS from 'aws-sdk';

const client = new RekognitionClient({ region: 'us-west-2' });

export async function enrollFace(collectionId, bytes, personId) {
  return client.send(
    new IndexFacesCommand({ CollectionId: collectionId, Image: { Bytes: bytes }, ExternalImageId: personId }),
  );
}

export async function findPerson(collectionId, bytes) {
  const reply = await client.send(
    new SearchFacesByImageCommand({ CollectionId: collectionId, Image: { Bytes: bytes }, FaceMatchThreshold: 90 }),
  );
  return reply.FaceMatches?.[0]?.Face?.ExternalImageId;
}

export async function samePerson(sourceBytes, targetBytes) {
  const reply = await client.send(
    new CompareFacesCommand({ SourceImage: { Bytes: sourceBytes }, TargetImage: { Bytes: targetBytes } }),
  );
  return reply.FaceMatches.length > 0;
}

export function legacyCompare(rekognition, params) {
  return rekognition.compareFaces(params).promise();
}
