// lexcode-expect: 2
// Document-and-selfie identity verification in the browser: a captured face
// image goes to the server beside an image of the person's photo ID.
export async function submitVerification(faceBlob, idBlob) {
  const form = new FormData();
  form.append('selfie', faceBlob);
  form.append('id_document_front', idBlob);
  return fetch('/api/verification', { method: 'POST', body: form });
}

export const reviewRequest = (faceImage, passportPhoto) => ({
  faceImage: faceImage,
  passportPhoto: passportPhoto,
  submittedAt: Date.now(),
});
